<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberInfo;
use App\Models\MemberLoanAccount;
use App\Models\MemberLoanApplication;
use App\Models\MemberLoanTransaction;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MemberLoanMigrationController extends Controller
{
    private const REQUIRED_HEADERS = [
        'member_id',
        'member_name',
        'disbursed_date',
        'original_principal',
        'outstanding_principal',
        'last_accrual_date',
        'next_accrual_date',
        'last_payment_date',
        'total_interest_accrued',
        'total_paid_amount',
        'total_principal_paid',
        'total_interest_paid',
    ];

    public function meta()
    {
        $products = Product::query()
            ->where('product_type', 'member_loan')
            ->where('status', 'active')
            ->orderBy('product_name')
            ->get(['id', 'product_name', 'profit_rate']);

        return response()->json([
            'products' => $products,
            'sample_url' => url('/api/member-loan-migrations/template'),
            'required_headers' => self::REQUIRED_HEADERS,
        ]);
    }

    public function template()
    {
        $members = MemberInfo::query()
            ->orderBy('member_name')
            ->get(['id', 'member_name']);

        $fileName = 'member-loan-migration-template-' . now()->format('YmdHis') . '.csv';

        return response()->streamDownload(function () use ($members) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, self::REQUIRED_HEADERS);

            foreach ($members as $member) {
                fputcsv($handle, [
                    $member->id,
                    $member->member_name,
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                ]);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:product_mst,id',
            'migration_file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $product = Product::query()
            ->where('id', $validated['product_id'])
            ->where('product_type', 'member_loan')
            ->first();

        if (!$product) {
            return response()->json([
                'message' => 'Selected product must be a member loan product.',
            ], 422);
        }

        $parsed = $this->parseFile($request->file('migration_file')->getRealPath(), $product);

        if (!empty($parsed['errors'])) {
            return response()->json([
                'message' => 'Template validation failed. Please correct the rows and upload again.',
                'errors' => $parsed['errors'],
            ], 422);
        }

        $importedAccounts = DB::transaction(function () use ($parsed, $product) {
            $accounts = [];

            foreach ($parsed['rows'] as $row) {
                $application = MemberLoanApplication::create([
                    'samity_id' => $row['member']->samity_id,
                    'member_id' => $row['member']->id,
                    'product_id' => $product->id,
                    'application_no' => $this->generateApplicationNo($row['line']),
                    'application_date' => $row['disbursed_date'],
                    'requested_amount' => $row['original_principal'],
                    'approved_amount' => $row['original_principal'],
                    'tenure_months' => 1,
                    'monthly_interest_rate' => 1,
                    'approved_date' => $row['disbursed_date'],
                    'disbursed_date' => $row['disbursed_date'],
                    'purpose' => 'Legacy member loan migration',
                    'remarks' => 'Imported from member loan migration template',
                    'status' => $row['status'] === 'closed' ? 'closed' : 'disbursed',
                    'approved_by' => Auth::id(),
                    'disbursed_by' => Auth::id(),
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);

                $account = MemberLoanAccount::create([
                    'member_loan_application_id' => $application->id,
                    'samity_id' => $row['member']->samity_id,
                    'member_id' => $row['member']->id,
                    'product_id' => $product->id,
                    'account_no' => $this->generateAccountNo($row['member'], $application->id),
                    'disbursed_date' => $row['disbursed_date'],
                    'original_principal' => $row['original_principal'],
                    'outstanding_principal' => $row['outstanding_principal'],
                    'accrued_interest_balance' => $row['accrued_interest_balance'],
                    'overdue_interest_balance' => 0,
                    'total_outstanding' => $row['total_outstanding'],
                    'monthly_interest_rate' => 1,
                    'last_accrual_date' => $row['last_accrual_date'],
                    'next_accrual_date' => $row['next_accrual_date'],
                    'last_payment_date' => $row['last_payment_date'],
                    'total_interest_accrued' => $row['total_interest_accrued'],
                    'total_overdue_interest_accrued' => 0,
                    'total_paid_amount' => $row['total_paid_amount'],
                    'total_principal_paid' => $row['total_principal_paid'],
                    'total_interest_paid' => $row['total_interest_paid'],
                    'total_overdue_interest_paid' => 0,
                    'closed_date' => $row['status'] === 'closed' ? ($row['last_payment_date'] ?: $row['last_accrual_date'] ?: $row['disbursed_date']) : null,
                    'status' => $row['status'],
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);

                MemberLoanTransaction::create([
                    'member_loan_account_id' => $account->id,
                    'member_loan_application_id' => $application->id,
                    'samity_id' => $account->samity_id,
                    'member_id' => $account->member_id,
                    'product_id' => $account->product_id,
                    'transaction_date' => $row['last_payment_date'] ?: $row['last_accrual_date'] ?: $row['disbursed_date'],
                    'reference_no' => $account->account_no,
                    'batch_num' => 'MLIMP' . str_pad((string) $account->id, 5, '0', STR_PAD_LEFT),
                    'transaction_type' => 'adjustment',
                    'input_emi_amount' => 0,
                    'input_interest_amount' => 0,
                    'input_total_amount' => 0,
                    'accrued_interest_amount' => 0,
                    'overdue_interest_amount' => 0,
                    'applied_interest_amount' => 0,
                    'applied_overdue_interest_amount' => 0,
                    'applied_principal_amount' => 0,
                    'principal_balance_after' => $row['outstanding_principal'],
                    'interest_balance_after' => $row['accrued_interest_balance'],
                    'overdue_balance_after' => 0,
                    'total_outstanding_after' => $row['total_outstanding'],
                    'remarks' => 'Legacy member loan imported as opening balance',
                    'created_by' => Auth::id(),
                ]);

                $accounts[] = $account->load('member', 'samity');
            }

            return $accounts;
        });

        return response()->json([
            'message' => 'Legacy member loans imported successfully.',
            'imported_count' => count($importedAccounts),
            'accounts' => $importedAccounts,
        ]);
    }

    private function parseFile(string $path, Product $product): array
    {
        $handle = fopen($path, 'r');

        if (!$handle) {
            return [
                'rows' => [],
                'errors' => ['Unable to read uploaded file.'],
            ];
        }

        $header = fgetcsv($handle);
        $normalizedHeader = array_map(fn ($item) => $this->normalizeHeader($item), $header ?: []);
        $missingHeaders = array_values(array_diff(self::REQUIRED_HEADERS, $normalizedHeader));

        if ($missingHeaders) {
            fclose($handle);

            return [
                'rows' => [],
                'errors' => ['Missing required columns: ' . implode(', ', $missingHeaders)],
            ];
        }

        $rows = [];
        $errors = [];
        $seenDuplicateKeys = [];
        $line = 1;

        while (($csvRow = fgetcsv($handle)) !== false) {
            $line++;

            if ($this->isBlankRow($csvRow)) {
                continue;
            }

            $mappedRow = [];
            foreach ($normalizedHeader as $index => $column) {
                $mappedRow[$column] = trim((string) ($csvRow[$index] ?? ''));
            }

            $rowErrors = [];
            $memberId = (int) ($mappedRow['member_id'] ?? 0);
            $memberName = $mappedRow['member_name'] ?? '';
            $member = MemberInfo::query()->find($memberId);

            if (!$member) {
                $rowErrors[] = "Row {$line}: member_id {$memberId} not found.";
            } elseif ($memberName !== '' && Str::lower(trim($member->member_name)) !== Str::lower(trim($memberName))) {
                $rowErrors[] = "Row {$line}: member_name does not match member_id {$memberId}.";
            }

            $disbursedDate = $this->parseDateValue($mappedRow['disbursed_date'] ?? null, "Row {$line}: disbursed_date is invalid.", $rowErrors, false);
            $lastAccrualDate = $this->parseDateValue($mappedRow['last_accrual_date'] ?? null, "Row {$line}: last_accrual_date is invalid.", $rowErrors, true);
            $nextAccrualDate = $this->parseDateValue($mappedRow['next_accrual_date'] ?? null, "Row {$line}: next_accrual_date is invalid.", $rowErrors, true);
            $lastPaymentDate = $this->parseDateValue($mappedRow['last_payment_date'] ?? null, "Row {$line}: last_payment_date is invalid.", $rowErrors, true);

            $originalPrincipal = $this->parseAmountValue($mappedRow['original_principal'] ?? null, "Row {$line}: original_principal is invalid.", $rowErrors);
            $outstandingPrincipal = $this->parseAmountValue($mappedRow['outstanding_principal'] ?? null, "Row {$line}: outstanding_principal is invalid.", $rowErrors);
            $totalInterestAccrued = $this->parseAmountValue($mappedRow['total_interest_accrued'] ?? 0, "Row {$line}: total_interest_accrued is invalid.", $rowErrors, true);
            $totalPaidAmount = $this->parseAmountValue($mappedRow['total_paid_amount'] ?? 0, "Row {$line}: total_paid_amount is invalid.", $rowErrors, true);
            $totalPrincipalPaid = $this->parseAmountValue($mappedRow['total_principal_paid'] ?? 0, "Row {$line}: total_principal_paid is invalid.", $rowErrors, true);
            $totalInterestPaid = $this->parseAmountValue($mappedRow['total_interest_paid'] ?? 0, "Row {$line}: total_interest_paid is invalid.", $rowErrors, true);

            if ($originalPrincipal !== null && $originalPrincipal <= 0) {
                $rowErrors[] = "Row {$line}: original_principal must be greater than zero.";
            }

            if ($outstandingPrincipal !== null && $outstandingPrincipal < 0) {
                $rowErrors[] = "Row {$line}: outstanding_principal cannot be negative.";
            }

            if ($originalPrincipal !== null && $outstandingPrincipal !== null && $outstandingPrincipal - $originalPrincipal > 0.009) {
                $rowErrors[] = "Row {$line}: outstanding_principal cannot exceed original_principal.";
            }

            $accruedInterestBalance = round(max(($totalInterestAccrued ?? 0) - ($totalInterestPaid ?? 0), 0), 2);
            $computedTotalPaidAmount = round(max($totalPaidAmount ?? 0, ($totalPrincipalPaid ?? 0) + ($totalInterestPaid ?? 0)), 2);
            $totalOutstanding = round(($outstandingPrincipal ?? 0) + $accruedInterestBalance, 2);

            if ($member && $disbursedDate && $originalPrincipal !== null) {
                $duplicateDb = MemberLoanAccount::query()
                    ->where('member_id', $member->id)
                    ->where('product_id', $product->id)
                    ->whereDate('disbursed_date', $disbursedDate)
                    ->where('original_principal', $originalPrincipal)
                    ->exists();

                if ($duplicateDb) {
                    $rowErrors[] = "Row {$line}: same member loan already exists in system.";
                }

                $duplicateKey = implode('|', [$member->id, $disbursedDate, number_format($originalPrincipal, 2, '.', '')]);
                if (isset($seenDuplicateKeys[$duplicateKey])) {
                    $rowErrors[] = "Row {$line}: duplicate row found in upload file.";
                }
                $seenDuplicateKeys[$duplicateKey] = true;
            }

            if ($rowErrors) {
                $errors = array_merge($errors, $rowErrors);
                continue;
            }

            $rows[] = [
                'line' => $line,
                'member' => $member,
                'disbursed_date' => $disbursedDate,
                'original_principal' => $originalPrincipal,
                'outstanding_principal' => $outstandingPrincipal,
                'last_accrual_date' => $lastAccrualDate,
                'next_accrual_date' => $nextAccrualDate,
                'last_payment_date' => $lastPaymentDate,
                'total_interest_accrued' => $totalInterestAccrued,
                'total_paid_amount' => $computedTotalPaidAmount,
                'total_principal_paid' => $totalPrincipalPaid,
                'total_interest_paid' => $totalInterestPaid,
                'accrued_interest_balance' => $accruedInterestBalance,
                'total_outstanding' => $totalOutstanding,
                'status' => $this->determineStatus($totalOutstanding, $nextAccrualDate),
            ];
        }

        fclose($handle);

        if (empty($rows) && empty($errors)) {
            $errors[] = 'Uploaded file does not contain any data row.';
        }

        return [
            'rows' => $rows,
            'errors' => $errors,
        ];
    }

    private function normalizeHeader(?string $header): string
    {
        return Str::of((string) $header)
            ->trim()
            ->lower()
            ->replace(' ', '_')
            ->replace('-', '_')
            ->toString();
    }

    private function isBlankRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function parseDateValue(?string $value, string $errorMessage, array &$rowErrors, bool $nullable): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            if ($nullable) {
                return null;
            }

            $rowErrors[] = $errorMessage;

            return null;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable $e) {
            $rowErrors[] = $errorMessage;

            return null;
        }
    }

    private function parseAmountValue($value, string $errorMessage, array &$rowErrors, bool $nullable = false): ?float
    {
        $value = trim((string) $value);

        if ($value === '') {
            if ($nullable) {
                return 0;
            }

            $rowErrors[] = $errorMessage;

            return null;
        }

        if (!is_numeric($value)) {
            $rowErrors[] = $errorMessage;

            return null;
        }

        return round((float) $value, 2);
    }

    private function determineStatus(float $totalOutstanding, ?string $nextAccrualDate): string
    {
        if ($totalOutstanding <= 0.009) {
            return 'closed';
        }

        if ($nextAccrualDate && Carbon::parse($nextAccrualDate)->startOfDay()->lessThanOrEqualTo(now()->startOfDay())) {
            return 'overdue';
        }

        return 'active';
    }

    private function generateApplicationNo(int $line): string
    {
        return 'MLA-IMP-' . now()->format('YmdHis') . str_pad((string) $line, 3, '0', STR_PAD_LEFT);
    }

    private function generateAccountNo(MemberInfo $member, int $applicationId): string
    {
        return 'ML-IMP-' . ($member->member_code ?: $member->id) . '-' . str_pad((string) $applicationId, 5, '0', STR_PAD_LEFT);
    }
}
