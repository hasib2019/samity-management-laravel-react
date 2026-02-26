<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Attendance;
use App\Models\HR\EmployeeSalary;
use App\Models\HR\PayrollRun;
use App\Models\HR\Payslip;
use App\Models\HR\SalaryComponent;
use App\Models\Transaction;
use App\Models\GlMstMapping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\CarbonPeriod;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class PayrollController extends Controller
{
    public function runs()
    {
        $items = PayrollRun::latest()->paginate(30);
        return response()->json($items);
    }

    public function payslips(Request $request)
    {
        $query = Payslip::with(['employee','run']);
        if ($request->filled('run_id')) $query->where('payroll_run_id', $request->run_id);
        if ($request->filled('employee_id')) $query->where('employee_id', $request->employee_id);
        $items = $query->latest()->paginate(50);
        return response()->json($items);
    }

    public function run(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'period_year' => 'required|integer|min:2000',
            'period_month' => 'required|integer|min:1|max:12',
        ]);
        if ($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        $year = (int)$request->period_year;
        $month = (int)$request->period_month;

        $run = PayrollRun::firstOrCreate(
            ['period_year'=>$year,'period_month'=>$month],
            ['status'=>'draft','created_by'=>Auth::id(),'updated_by'=>Auth::id()]
        );

        DB::transaction(function () use ($run, $year, $month) {
            $components = SalaryComponent::where('is_active', true)->get();
            $salaries = EmployeeSalary::with('employee')->where('is_active', true)->get();
            $start = Carbon::create($year, $month, 1)->startOfMonth();
            $end = Carbon::create($year, $month, 1)->endOfMonth();
            $daysInMonth = $start->daysInMonth;
            foreach ($salaries as $salary) {
                $presentDays = 0;
                $halfDays = 0;
                $leaveDays = 0;
                $period = CarbonPeriod::create($start, $end);
                foreach ($period as $date) {
                    $att = Attendance::where('employee_id', $salary->employee_id)->whereDate('date', $date)->first();
                    if ($att) {
                        if ($att->status === 'present') $presentDays += 1;
                        elseif ($att->status === 'half') $halfDays += 1;
                        elseif ($att->status === 'leave') $leaveDays += 1;
                    }
                }
                $payableDays = $presentDays + ($halfDays * 0.5) + $leaveDays;
                $baseProrated = $daysInMonth > 0 ? ($salary->base_salary * ($payableDays / $daysInMonth)) : 0;

                $detail = [];
                $gross = 0;
                $deduction = 0;

                foreach ($components as $c) {
                    if ($c->type === 'basic') {
                        $val = $baseProrated;
                        $detail[] = ['code'=>$c->code,'name'=>$c->name,'type'=>$c->type,'amount'=>$val];
                        $gross += $val;
                        continue;
                    }
                    $base = $baseProrated;
                    $amount = $c->amount_type === 'percent' ? ($base * ($c->amount/100)) : $c->amount;
                    $detail[] = ['code'=>$c->code,'name'=>$c->name,'type'=>$c->type,'amount'=>$amount];
                    if ($c->type === 'earning') $gross += $amount;
                    if ($c->type === 'deduction') $deduction += $amount;
                }

                $net = max($gross - $deduction, 0);

                Payslip::updateOrCreate(
                    ['payroll_run_id'=>$run->id,'employee_id'=>$salary->employee_id],
                    [
                        'gross'=>$gross,
                        'total_deduction'=>$deduction,
                        'net'=>$net,
                        'components'=>$detail,
                        'created_by'=>Auth::id(),
                        'updated_by'=>Auth::id(),
                    ]
                );
            }
            $run->update(['status'=>'processed','processed_at'=>now(),'updated_by'=>Auth::id()]);
        });

        return response()->json(['message'=>'Payroll processed','data'=>$run]);
    }

    public function summary(Request $request)
    {
        $request->validate(['run_id' => 'required|exists:hr_payroll_runs,id']);
        $runId = (int)$request->run_id;
        $items = Payslip::with(['employee.department'])->where('payroll_run_id', $runId)->get();
        $byDept = [];
        $overall = ['headcount'=>0,'gross'=>0,'deduction'=>0,'net'=>0];
        foreach ($items as $p) {
            $deptName = $p->employee?->department?->name ?? 'Unassigned';
            if (!isset($byDept[$deptName])) {
                $byDept[$deptName] = ['department'=>$deptName,'headcount'=>0,'gross'=>0,'deduction'=>0,'net'=>0];
            }
            $byDept[$deptName]['headcount'] += 1;
            $byDept[$deptName]['gross'] += (float)$p->gross;
            $byDept[$deptName]['deduction'] += (float)$p->total_deduction;
            $byDept[$deptName]['net'] += (float)$p->net;
            $overall['headcount'] += 1;
            $overall['gross'] += (float)$p->gross;
            $overall['deduction'] += (float)$p->total_deduction;
            $overall['net'] += (float)$p->net;
        }
        $rows = array_values($byDept);
        return response()->json(['rows'=>$rows,'overall'=>$overall]);
    }

    public function summaryCsv(Request $request)
    {
        $request->validate(['run_id' => 'required|exists:hr_payroll_runs,id']);
        $runId = (int)$request->run_id;
        $items = Payslip::with(['employee.department'])->where('payroll_run_id', $runId)->get();
        $byDept = [];
        $overall = ['headcount'=>0,'gross'=>0,'deduction'=>0,'net'=>0];
        foreach ($items as $p) {
            $deptName = $p->employee?->department?->name ?? 'Unassigned';
            if (!isset($byDept[$deptName])) {
                $byDept[$deptName] = ['department'=>$deptName,'headcount'=>0,'gross'=>0,'deduction'=>0,'net'=>0];
            }
            $byDept[$deptName]['headcount'] += 1;
            $byDept[$deptName]['gross'] += (float)$p->gross;
            $byDept[$deptName]['deduction'] += (float)$p->total_deduction;
            $byDept[$deptName]['net'] += (float)$p->net;
            $overall['headcount'] += 1;
            $overall['gross'] += (float)$p->gross;
            $overall['deduction'] += (float)$p->total_deduction;
            $overall['net'] += (float)$p->net;
        }
        $filename = 'payroll_summary_run_' . $runId . '.csv';
        $response = new StreamedResponse(function () use ($byDept, $overall) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Department','Headcount','Gross','Deduction','Net']);
            foreach ($byDept as $row) {
                fputcsv($handle, [
                    $row['department'],
                    $row['headcount'],
                    number_format($row['gross'], 2, '.', ''),
                    number_format($row['deduction'], 2, '.', ''),
                    number_format($row['net'], 2, '.', ''),
                ]);
            }
            fputcsv($handle, []);
            fputcsv($handle, [
                'TOTAL',
                $overall['headcount'],
                number_format($overall['gross'], 2, '.', ''),
                number_format($overall['deduction'], 2, '.', ''),
                number_format($overall['net'], 2, '.', ''),
            ]);
            fclose($handle);
        });
        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="'.$filename.'"');
        return $response;
    }

    public function postGl(Request $request, $id = null)
    {
        $runId = $id ?? (int) $request->run_id;
        $validator = Validator::make(array_merge($request->all(), ['run_id' => $runId]), [
            'run_id' => 'required|exists:hr_payroll_runs,id',
            'tran_date' => 'nullable|date',
            'expense_gl_id' => 'required|exists:glac_mst,id',
            'bank_gl_id' => 'required|exists:glac_mst,id',
            'deduction_gl_id' => 'nullable|exists:glac_mst,id',
            'naration' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $run = PayrollRun::findOrFail($runId);
        $payslips = Payslip::where('payroll_run_id', $run->id)->get();
        if ($payslips->count() === 0) {
            return response()->json(['message' => 'No payslips found for this run'], 422);
        }

        $totalGross = (float) $payslips->sum('gross');
        $totalDeduction = (float) $payslips->sum('total_deduction');
        $totalNet = (float) $payslips->sum('net');

        if ($totalDeduction > 0 && !$request->filled('deduction_gl_id')) {
            return response()->json(['message' => 'deduction_gl_id is required because total deduction > 0'], 422);
        }

        $tranDate = $request->tran_date ?: Carbon::create($run->period_year, $run->period_month, 1)->endOfMonth()->toDateString();
        $naration = $request->naration ?: ('Payroll ' . $run->period_year . '-' . str_pad($run->period_month, 2, '0', STR_PAD_LEFT));

        $batch = 'PRL' . str_pad($run->id, 6, '0', STR_PAD_LEFT) . $run->period_year . str_pad($run->period_month, 2, '0', STR_PAD_LEFT);
        $already = Transaction::where('tran_type', 'Payroll')->where('batch_num', $batch)->exists();
        if ($already) {
            return response()->json(['message' => 'GL already posted for this payroll run', 'batch' => $batch], 409);
        }

        DB::transaction(function () use ($request, $batch, $tranDate, $naration, $totalGross, $totalNet, $totalDeduction) {
            $common = [
                'payment_mode' => 'bank',
                'batch_num' => $batch,
                'tran_type' => 'Payroll',
                'tran_date' => $tranDate,
                'naration' => $naration,
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => now(),
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
                'status' => 'posted',
            ];

            // Dr Salary Expense (Gross)
            Transaction::create(array_merge($common, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $request->expense_gl_id,
                'dr_amt' => $totalGross,
                'cr_amt' => 0,
            ]));

            // Cr Bank/Cash (Net)
            Transaction::create(array_merge($common, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $request->bank_gl_id,
                'dr_amt' => 0,
                'cr_amt' => $totalNet,
            ]));

            // Cr Deductions Liability (Total Deduction) - optional if > 0
            if ($totalDeduction > 0 && $request->filled('deduction_gl_id')) {
                Transaction::create(array_merge($common, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $request->deduction_gl_id,
                    'dr_amt' => 0,
                    'cr_amt' => $totalDeduction,
                ]));
            }
        });

        return response()->json([
            'message' => 'Payroll GL posted successfully',
            'batch' => $batch,
            'totals' => [
                'gross' => $totalGross,
                'deduction' => $totalDeduction,
                'net' => $totalNet,
            ],
        ], 201);
    }

    public function bankCsv(Request $request)
    {
        $request->validate(['run_id' => 'required|exists:hr_payroll_runs,id']);
        $run = PayrollRun::findOrFail($request->run_id);
        $payslips = Payslip::with('employee')->where('payroll_run_id', $run->id)->get();
        $filename = 'payroll_bank_run_' . $run->id . '_' . $run->period_year . str_pad($run->period_month, 2, '0', STR_PAD_LEFT) . '.csv';

        $response = new StreamedResponse(function () use ($payslips, $run) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Bank Account No', 'Employee Code', 'Employee Name', 'Bank Name', 'Amount', 'Narration']);
            $narr = 'Salary ' . $run->period_year . '-' . str_pad($run->period_month, 2, '0', STR_PAD_LEFT);
            foreach ($payslips as $p) {
                $emp = $p->employee;
                fputcsv($handle, [
                    $emp?->bank_account_no ?? '',
                    $emp?->code ?? $p->employee_id,
                    $emp?->full_name ?? ('Employee ' . $p->employee_id),
                    $emp?->bank_name ?? '',
                    number_format((float)$p->net, 2, '.', ''),
                    $narr,
                ]);
            }
            fclose($handle);
        });
        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="'.$filename.'"');
        return $response;
    }

    public function payslipPdf($id)
    {
        $payslip = Payslip::with(['employee', 'run'])->findOrFail($id);
        $pdf = Pdf::loadView('hr.payslip_pdf', ['payslip' => $payslip]);
        $file = 'payslip_' . $payslip->id . '_' . $payslip->run?->period_year . str_pad($payslip->run?->period_month ?? 0, 2, '0', STR_PAD_LEFT) . '.pdf';
        return $pdf->download($file);
    }

    public function accrueGl(Request $request, $id = null)
    {
        $runId = $id ?? (int) $request->run_id;
        $validator = Validator::make(array_merge($request->all(), ['run_id' => $runId]), [
            'run_id' => 'required|exists:hr_payroll_runs,id',
            'tran_date' => 'nullable|date',
            'expense_gl_id' => 'required|exists:glac_mst,id',
            'salary_payable_gl_id' => 'required|exists:glac_mst,id',
            'deduction_gl_id' => 'nullable|exists:glac_mst,id',
            'naration' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $run = PayrollRun::findOrFail($runId);
        $payslips = Payslip::where('payroll_run_id', $run->id)->get();
        if ($payslips->count() === 0) {
            return response()->json(['message' => 'No payslips found for this run'], 422);
        }

        $totalGross = (float) $payslips->sum('gross');
        $totalDeduction = (float) $payslips->sum('total_deduction');
        $totalNet = (float) $payslips->sum('net');

        if ($totalDeduction > 0 && !$request->filled('deduction_gl_id')) {
            return response()->json(['message' => 'deduction_gl_id is required because total deduction > 0'], 422);
        }

        $tranDate = $request->tran_date ?: Carbon::create($run->period_year, $run->period_month, 1)->endOfMonth()->toDateString();
        $naration = $request->naration ?: ('Payroll Accrual ' . $run->period_year . '-' . str_pad($run->period_month, 2, '0', STR_PAD_LEFT));
        $base = 'PRL' . str_pad($run->id, 6, '0', STR_PAD_LEFT) . $run->period_year . str_pad($run->period_month, 2, '0', STR_PAD_LEFT);
        $batch = $base . 'A';

        $already = Transaction::where('tran_type', 'Payroll-Accrual')->where('batch_num', $batch)->exists();
        if ($already) {
            return response()->json(['message' => 'Accrual already posted for this payroll run', 'batch' => $batch], 409);
        }

        DB::transaction(function () use ($request, $batch, $tranDate, $naration, $totalGross, $totalNet, $totalDeduction, $run) {
            $common = [
                'payment_mode' => 'bank',
                'batch_num' => $batch,
                'tran_type' => 'Payroll-Accrual',
                'tran_date' => $tranDate,
                'naration' => $naration,
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => now(),
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
                'status' => 'posted',
            ];

            Transaction::create(array_merge($common, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $request->expense_gl_id,
                'dr_amt' => $totalGross,
                'cr_amt' => 0,
            ]));

            Transaction::create(array_merge($common, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $request->salary_payable_gl_id,
                'dr_amt' => 0,
                'cr_amt' => $totalNet,
            ]));

            if ($totalDeduction > 0) {
                $items = Payslip::where('payroll_run_id', $run->id)->get();
                $byCode = [];
                foreach ($items as $p) {
                    $components = is_array($p->components) ? $p->components : [];
                    foreach ($components as $c) {
                        $type = $c['type'] ?? null;
                        $code = strtoupper($c['code'] ?? '');
                        $amount = (float) ($c['amount'] ?? 0);
                        if ($type === 'deduction' && $code) {
                            if (!isset($byCode[$code])) $byCode[$code] = 0.0;
                            $byCode[$code] += $amount;
                        }
                    }
                }
                $unmapped = 0.0;
                foreach ($byCode as $code => $amount) {
                    $map = GlMstMapping::where('gl_code_type', 'PAYROLL_DED_' . $code)->where('status', true)->first();
                    if ($map) {
                        Transaction::create(array_merge($common, [
                            'tran_num' => date('YmdHis') . rand(10, 99),
                            'glac_id' => $map->gl_mst_id,
                            'dr_amt' => 0,
                            'cr_amt' => $amount,
                            'naration' => $naration . ' (' . $code . ')',
                        ]));
                    } else {
                        $unmapped += $amount;
                    }
                }
                if ($unmapped > 0) {
                    if (!$request->filled('deduction_gl_id')) {
                        throw new \Exception('Deduction GL mapping missing for some components and deduction_gl_id not provided');
                    }
                    Transaction::create(array_merge($common, [
                        'tran_num' => date('YmdHis') . rand(10, 99),
                        'glac_id' => $request->deduction_gl_id,
                        'dr_amt' => 0,
                        'cr_amt' => $unmapped,
                        'naration' => $naration . ' (UNMAPPED)',
                    ]));
                }
            }
        });

        return response()->json([
            'message' => 'Payroll accrual posted successfully',
            'batch' => $batch,
            'totals' => [
                'gross' => $totalGross,
                'deduction' => $totalDeduction,
                'net' => $totalNet,
            ],
        ], 201);
    }

    public function payGl(Request $request, $id = null)
    {
        $runId = $id ?? (int) $request->run_id;
        $validator = Validator::make(array_merge($request->all(), ['run_id' => $runId]), [
            'run_id' => 'required|exists:hr_payroll_runs,id',
            'tran_date' => 'nullable|date',
            'salary_payable_gl_id' => 'required|exists:glac_mst,id',
            'bank_gl_id' => 'required|exists:glac_mst,id',
            'naration' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $run = PayrollRun::findOrFail($runId);
        $payslips = Payslip::where('payroll_run_id', $run->id)->get();
        if ($payslips->count() === 0) {
            return response()->json(['message' => 'No payslips found for this run'], 422);
        }

        $totalNet = (float) $payslips->sum('net');
        $tranDate = $request->tran_date ?: Carbon::create($run->period_year, $run->period_month, 1)->endOfMonth()->toDateString();
        $naration = $request->naration ?: ('Payroll Payment ' . $run->period_year . '-' . str_pad($run->period_month, 2, '0', STR_PAD_LEFT));
        $base = 'PRL' . str_pad($run->id, 6, '0', STR_PAD_LEFT) . $run->period_year . str_pad($run->period_month, 2, '0', STR_PAD_LEFT);
        $batch = $base . 'P';

        $already = Transaction::where('tran_type', 'Payroll-Payment')->where('batch_num', $batch)->exists();
        if ($already) {
            return response()->json(['message' => 'Payment already posted for this payroll run', 'batch' => $batch], 409);
        }

        DB::transaction(function () use ($request, $batch, $tranDate, $naration, $totalNet) {
            $common = [
                'payment_mode' => 'bank',
                'batch_num' => $batch,
                'tran_type' => 'Payroll-Payment',
                'tran_date' => $tranDate,
                'naration' => $naration,
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => now(),
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
                'status' => 'posted',
            ];

            Transaction::create(array_merge($common, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $request->salary_payable_gl_id,
                'dr_amt' => $totalNet,
                'cr_amt' => 0,
            ]));

            Transaction::create(array_merge($common, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $request->bank_gl_id,
                'dr_amt' => 0,
                'cr_amt' => $totalNet,
            ]));
        });

        return response()->json([
            'message' => 'Payroll payment posted successfully',
            'batch' => $batch,
            'totals' => [
                'net' => $totalNet,
            ],
        ], 201);
    }
}
