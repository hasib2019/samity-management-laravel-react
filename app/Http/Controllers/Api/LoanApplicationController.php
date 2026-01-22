<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

use App\Models\LoanRepaymentSchedule;
use Carbon\Carbon;

class LoanApplicationController extends Controller
{
    public function index(Request $request)
    {
        $query = LoanApplication::with(['member', 'samity', 'product', 'creator']);

        if ($request->has('samity_id')) {
            $query->where('samity_id', $request->samity_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from') && $request->has('date_to')) {
            $query->whereBetween('apply_date', [$request->date_from, $request->date_to]);
        }

        $applications = $query->latest()->paginate(20);
        return response()->json($applications);
    }

    public function approve($id)
    {
        $application = LoanApplication::with('product')->find($id);

        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        if ($application->status !== 'pending') {
            return response()->json(['message' => 'Application is not in pending state'], 400);
        }

        try {
            DB::beginTransaction();

            // Update status to approved
            $application->update([
                'status' => 'approved',
                'updated_by' => auth()->id()
            ]);

            // Generate Repayment Schedule
            $this->generateSchedule($application);

            DB::commit();

            return response()->json(['message' => 'Loan Approved and Schedule Generated', 'data' => $application]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to approve loan: ' . $e->getMessage()], 500);
        }
    }

    public function previewSchedule($id)
    {
        $application = LoanApplication::with('product')->find($id);

        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        $schedule = $this->calculateScheduleData($application);

        return response()->json($schedule);
    }

    private function generateSchedule(LoanApplication $application)
    {
        $scheduleData = $this->calculateScheduleData($application);

        foreach ($scheduleData as $item) {
            LoanRepaymentSchedule::create([
                'loan_application_id' => $application->id,
                'installment_no' => $item['installment_no'],
                'due_date' => $item['due_date'],
                'principal_amount' => $item['principal_amount'],
                'interest_amount' => $item['interest_amount'],
                'total_amount' => $item['total_amount'],
                'status' => 'pending'
            ]);
        }
    }

    private function calculateScheduleData(LoanApplication $application)
    {
        $principal = $application->amount;
        $rate = $application->interest_rate; // Annual interest rate
        $durationMonths = $application->duration_months;
        $type = $application->installment_type;
        $rateType = $application->product?->rate_type ?? 'flat'; // Default to flat if not set

        // Determine number of installments and frequency
        $numInstallments = 0;
        $frequencyDays = 0;
        $frequencyPerYear = 0;

        if ($type === 'weekly') {
            $numInstallments = $durationMonths * 4; // Approx 4 weeks per month
            $frequencyDays = 7;
            $frequencyPerYear = 52;
        } else {
            $numInstallments = $durationMonths;
            $frequencyDays = 30; // Approx
            $frequencyPerYear = 12;
        }

        $startDate = Carbon::parse($application->apply_date)->addDays($frequencyDays);
        $schedule = [];

        if ($rateType === 'interest_free') {
            $schedule = $this->calculateInterestFreeSchedule($numInstallments, $principal, $startDate, $frequencyDays);
        } elseif ($rateType === 'reducing' || $rateType === 'floating') {
            $schedule = $this->calculateReducingBalanceSchedule($numInstallments, $principal, $rate, $frequencyPerYear, $startDate, $frequencyDays);
        } else {
            // Default to Flat Rate (includes 'fixed' and 'flat')
            $schedule = $this->calculateFlatRateSchedule($numInstallments, $principal, $rate, $durationMonths, $startDate, $frequencyDays);
        }

        return $schedule;
    }

    private function calculateInterestFreeSchedule($numInstallments, $principal, $startDate, $frequencyDays)
    {
        $installmentPrincipal = $principal / $numInstallments;
        $schedule = [];
        
        for ($i = 1; $i <= $numInstallments; $i++) {
            $schedule[] = [
                'installment_no' => $i,
                'due_date' => $startDate->copy()->addDays(($i - 1) * $frequencyDays),
                'principal_amount' => round($installmentPrincipal, 2),
                'interest_amount' => 0,
                'total_amount' => round($installmentPrincipal, 2),
            ];
        }
        return $schedule;
    }

    private function calculateReducingBalanceSchedule($numInstallments, $principal, $rate, $frequencyPerYear, $startDate, $frequencyDays)
    {
        // Standard EMI Calculation: E = P * r * (1+r)^n / ((1+r)^n - 1)
        // r = annual rate / frequency per year / 100
        
        $r = ($rate / $frequencyPerYear) / 100;
        $n = $numInstallments;
        $schedule = [];
        
        if ($r == 0) {
             return $this->calculateInterestFreeSchedule($numInstallments, $principal, $startDate, $frequencyDays);
        }

        $emi = $principal * $r * pow(1 + $r, $n) / (pow(1 + $r, $n) - 1);
        
        $balance = $principal;
        
        for ($i = 1; $i <= $numInstallments; $i++) {
            $interest = $balance * $r;
            $principalComponent = $emi - $interest;
            
            $balance -= $principalComponent;
            
            $schedule[] = [
                'installment_no' => $i,
                'due_date' => $startDate->copy()->addDays(($i - 1) * $frequencyDays),
                'principal_amount' => round($principalComponent, 2),
                'interest_amount' => round($interest, 2),
                'total_amount' => round($emi, 2),
            ];
        }
        return $schedule;
    }

    private function calculateFlatRateSchedule($numInstallments, $principal, $rate, $durationMonths, $startDate, $frequencyDays)
    {
        // Total Interest = Principal * (Rate/100) * (Duration/12)
        $totalInterest = $principal * ($rate / 100) * ($durationMonths / 12);
        $totalAmount = $principal + $totalInterest;

        $installmentPrincipal = $principal / $numInstallments;
        $installmentInterest = $totalInterest / $numInstallments;
        $installmentTotal = $totalAmount / $numInstallments;
        
        $schedule = [];

        for ($i = 1; $i <= $numInstallments; $i++) {
            $schedule[] = [
                'installment_no' => $i,
                'due_date' => $startDate->copy()->addDays(($i - 1) * $frequencyDays),
                'principal_amount' => round($installmentPrincipal, 2),
                'interest_amount' => round($installmentInterest, 2),
                'total_amount' => round($installmentTotal, 2),
            ];
        }
        return $schedule;
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'samity_id' => 'required|exists:samity_profiles,id',
            'member_id' => 'required|exists:member_infos,id',
            'product_id' => 'required|exists:product_mst,id',
            'amount' => 'required|numeric|min:1',
            'duration_months' => 'required|integer|min:1',
            'interest_rate' => 'required|numeric|min:0',
            'installment_type' => 'required|in:weekly,monthly',
            'apply_date' => 'required|date',
            'purpose' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $application = LoanApplication::create([
                'samity_id' => $request->samity_id,
                'member_id' => $request->member_id,
                'product_id' => $request->product_id,
                'amount' => $request->amount,
                'duration_months' => $request->duration_months,
                'interest_rate' => $request->interest_rate,
                'installment_type' => $request->installment_type,
                'apply_date' => $request->apply_date,
                'purpose' => $request->purpose,
                'status' => 'pending',
                'created_by' => auth()->id(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Loan Application submitted successfully',
                'data' => $application
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to submit application: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $application = LoanApplication::with(['member', 'samity', 'product'])->find($id);
        
        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        return response()->json($application);
    }

    public function update(Request $request, $id)
    {
        $application = LoanApplication::find($id);
        
        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        // Only allow update if pending
        if ($application->status !== 'pending') {
            return response()->json(['message' => 'Cannot update processed application'], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'numeric|min:1',
            'duration_months' => 'integer|min:1',
            'interest_rate' => 'numeric|min:0',
            'installment_type' => 'in:weekly,monthly',
            'apply_date' => 'date',
            'purpose' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $application->update($request->only([
            'amount', 'duration_months', 'interest_rate', 'installment_type', 'apply_date', 'purpose'
        ]));

        return response()->json(['message' => 'Application updated successfully', 'data' => $application]);
    }

    public function destroy($id)
    {
        $application = LoanApplication::find($id);
        
        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        if ($application->status !== 'pending') {
            return response()->json(['message' => 'Cannot delete processed application'], 403);
        }

        $application->delete();
        return response()->json(['message' => 'Application deleted successfully']);
    }
}
