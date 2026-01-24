<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Models\LoanNominee;
use App\Models\LoanGuarantor;
use App\Models\MemberInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

use App\Models\LoanRepaymentSchedule;
use Carbon\Carbon;

class LoanApplicationController extends Controller
{
    public function index(Request $request)
    {
        $query = LoanApplication::with(['member', 'samity', 'product', 'creator', 'nominees', 'guarantors']);

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
            
            // Validate nominees array
            'nominees' => 'nullable|array',
            'nominees.*.nominee_type' => 'required|in:member,external',
            'nominees.*.member_id' => 'required_if:nominees.*.nominee_type,member|nullable|exists:member_infos,id',
            'nominees.*.nominee_name' => 'required_if:nominees.*.nominee_type,external|nullable|string|max:150',
            'nominees.*.relation' => 'required_if:nominees.*.nominee_type,external|nullable|string|max:50',
            'nominees.*.dob' => 'nullable|date',
            'nominees.*.nid' => 'nullable|string|max:20',
            
            // Files for nominees
            'nominees.*.image' => 'nullable|file|mimes:jpeg,png,jpg|max:2048',
            'nominees.*.signature' => 'nullable|file|mimes:jpeg,png,jpg|max:2048',
            'nominees.*.nid_image' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:2048',
            'nominees.*.other_documents' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',

            // Validate guarantors array
            'guarantors' => 'nullable|array',
            'guarantors.*.guarantor_type' => 'required|in:member,external',
            'guarantors.*.member_id' => 'required_if:guarantors.*.guarantor_type,member|nullable|exists:member_infos,id',
            'guarantors.*.name' => 'required_if:guarantors.*.guarantor_type,external|nullable|string|max:150',
            'guarantors.*.father_name' => 'nullable|string|max:150',
            'guarantors.*.husband_name' => 'nullable|string|max:150',
            'guarantors.*.relation' => 'required_if:guarantors.*.guarantor_type,external|nullable|string|max:50',
            'guarantors.*.address' => 'nullable|string|max:255',
            'guarantors.*.contact_no' => 'required_if:guarantors.*.guarantor_type,external|nullable|string|max:20',
            'guarantors.*.nid' => 'nullable|string|max:20',
            
            // Files for guarantors
            'guarantors.*.image' => 'nullable|file|mimes:jpeg,png,jpg|max:2048',
            'guarantors.*.signature' => 'nullable|file|mimes:jpeg,png,jpg|max:2048',
            'guarantors.*.nid_image' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check for existing active loan
        $existingLoan = LoanApplication::where('member_id', $request->member_id)
            ->whereIn('status', ['pending', 'approved', 'disbursed'])
            ->first();

        if ($existingLoan) {
            return response()->json([
                'message' => 'This member already has an active loan application.',
                'errors' => ['member_id' => ['Member has an existing loan with status: ' . $existingLoan->status]]
            ], 422);
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

            // Handle Nominees
            if ($request->has('nominees')) {
                foreach ($request->nominees as $index => $nomineeData) {
                    
                    // Handle file uploads
                    $imagePath = $this->uploadNomineeFile($request, $index, 'image', 'loan_docs/nominee');
                    $signaturePath = $this->uploadNomineeFile($request, $index, 'signature', 'loan_docs/nominee');
                    $nidImagePath = $this->uploadNomineeFile($request, $index, 'nid_image', 'loan_docs/nid');
                    $otherDocsPath = $this->uploadNomineeFile($request, $index, 'other_documents', 'loan_docs/others');

                    LoanNominee::create([
                        'loan_application_id' => $application->id,
                        'nominee_type' => $nomineeData['nominee_type'],
                        'member_id' => $nomineeData['member_id'] ?? null,
                        'nominee_name' => $nomineeData['nominee_name'] ?? null,
                        'relation' => $nomineeData['relation'] ?? null,
                        'dob' => $nomineeData['dob'] ?? null,
                        'nid' => $nomineeData['nid'] ?? null,
                        'percentage' => $nomineeData['percentage'] ?? 100,
                        'image' => $imagePath,
                        'signature' => $signaturePath,
                        'nid_image' => $nidImagePath,
                        'other_documents' => $otherDocsPath,
                    ]);
                }
            }

            // Handle Guarantors
            if ($request->has('guarantors')) {
                foreach ($request->guarantors as $index => $guarantorData) {
                    
                    // Handle file uploads
                    $imagePath = $this->uploadGuarantorFile($request, $index, 'image', 'loan_docs/guarantor');
                    $signaturePath = $this->uploadGuarantorFile($request, $index, 'signature', 'loan_docs/guarantor');
                    $nidImagePath = $this->uploadGuarantorFile($request, $index, 'nid_image', 'loan_docs/nid');

                    // Populate data from member if type is member
                    $contactNo = $guarantorData['contact_no'] ?? null;
                    $name = $guarantorData['name'] ?? null;
                    $fatherName = $guarantorData['father_name'] ?? null;
                    $nid = $guarantorData['nid'] ?? null;

                    if ($guarantorData['guarantor_type'] === 'member' && !empty($guarantorData['member_id'])) {
                        $member = MemberInfo::find($guarantorData['member_id']);
                        if ($member) {
                            $contactNo = $contactNo ?: $member->mobile;
                            $name = $name ?: $member->member_name;
                            $fatherName = $fatherName ?: $member->father_name;
                            $nid = $nid ?: $member->nid;
                        }
                    }

                    LoanGuarantor::create([
                        'loan_application_id' => $application->id,
                        'guarantor_type' => $guarantorData['guarantor_type'],
                        'member_id' => $guarantorData['member_id'] ?? null,
                        'name' => $name,
                        'father_name' => $fatherName,
                        'husband_name' => $guarantorData['husband_name'] ?? null,
                        'relation' => $guarantorData['relation'] ?? null,
                        'address' => $guarantorData['address'] ?? null,
                        'contact_no' => $contactNo,
                        'nid' => $nid,
                        'image' => $imagePath,
                        'signature' => $signaturePath,
                        'nid_image' => $nidImagePath,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Loan Application submitted successfully',
                'data' => $application->load(['nominees', 'guarantors'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Loan Application Error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to submit application: ' . $e->getMessage()], 500);
        }
    }

    private function uploadNomineeFile(Request $request, $index, $key, $path)
    {
        if ($request->hasFile("nominees.{$index}.{$key}")) {
            $file = $request->file("nominees.{$index}.{$key}");
            $filename = time() . '_' . $index . '_' . $key . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/' . $path), $filename);
            return 'uploads/' . $path . '/' . $filename;
        }
        return null;
    }

    private function uploadGuarantorFile(Request $request, $index, $key, $path)
    {
        if ($request->hasFile("guarantors.{$index}.{$key}")) {
            $file = $request->file("guarantors.{$index}.{$key}");
            $filename = time() . '_g_' . $index . '_' . $key . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/' . $path), $filename);
            return 'uploads/' . $path . '/' . $filename;
        }
        return null;
    }

    public function show($id)
    {
        $application = LoanApplication::with(['member', 'samity', 'product', 'nominees', 'guarantors'])->find($id);
        
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

        // We'll focus on updating main details. Nominee update is complex with files, 
        // usually easier to delete all and recreate or handle separately. 
        // For now, let's allow updating main info and if nominees are provided, replace them.

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

        try {
            DB::beginTransaction();

            $application->update($request->only([
                'amount', 'duration_months', 'interest_rate', 'installment_type', 'apply_date', 'purpose', 'member_id', 'samity_id', 'product_id'
            ]));

            // If nominees are present in request, we replace them
            if ($request->has('nominees')) {
                // Delete existing nominees
                $application->nominees()->delete();

                foreach ($request->nominees as $index => $nomineeData) {
                    
                    // Handle file uploads - reusing store logic
                    // Note: If files are not re-uploaded, we might lose old files if we blindly replace.
                    // A proper implementation would check if file is string (existing path) or file object.
                    
                    // Simplified: Expect re-upload or handle existing path if sent as string
                    
                    $imagePath = $this->uploadNomineeFile($request, $index, 'image', 'loan_docs/nominee') ?? ($nomineeData['existing_image'] ?? null);
                    $signaturePath = $this->uploadNomineeFile($request, $index, 'signature', 'loan_docs/nominee') ?? ($nomineeData['existing_signature'] ?? null);
                    $nidImagePath = $this->uploadNomineeFile($request, $index, 'nid_image', 'loan_docs/nid') ?? ($nomineeData['existing_nid_image'] ?? null);
                    $otherDocsPath = $this->uploadNomineeFile($request, $index, 'other_documents', 'loan_docs/others') ?? ($nomineeData['existing_other_documents'] ?? null);

                    LoanNominee::create([
                        'loan_application_id' => $application->id,
                        'nominee_type' => $nomineeData['nominee_type'],
                        'member_id' => $nomineeData['member_id'] ?? null,
                        'nominee_name' => $nomineeData['nominee_name'] ?? null,
                        'relation' => $nomineeData['relation'] ?? null,
                        'dob' => $nomineeData['dob'] ?? null,
                        'nid' => $nomineeData['nid'] ?? null,
                        'percentage' => $nomineeData['percentage'] ?? 100,
                        'image' => $imagePath,
                        'signature' => $signaturePath,
                        'nid_image' => $nidImagePath,
                        'other_documents' => $otherDocsPath,
                    ]);
                }
            }

            // If guarantors are present in request, we replace them
            if ($request->has('guarantors')) {
                // Delete existing guarantors
                $application->guarantors()->delete();

                foreach ($request->guarantors as $index => $guarantorData) {
                    
                    $imagePath = $this->uploadGuarantorFile($request, $index, 'image', 'loan_docs/guarantor') ?? ($guarantorData['existing_image'] ?? null);
                    $signaturePath = $this->uploadGuarantorFile($request, $index, 'signature', 'loan_docs/guarantor') ?? ($guarantorData['existing_signature'] ?? null);
                    $nidImagePath = $this->uploadGuarantorFile($request, $index, 'nid_image', 'loan_docs/nid') ?? ($guarantorData['existing_nid_image'] ?? null);

                    // Populate data from member if type is member
                    $contactNo = $guarantorData['contact_no'] ?? null;
                    $name = $guarantorData['name'] ?? null;
                    $fatherName = $guarantorData['father_name'] ?? null;
                    $nid = $guarantorData['nid'] ?? null;

                    if ($guarantorData['guarantor_type'] === 'member' && !empty($guarantorData['member_id'])) {
                        $member = MemberInfo::find($guarantorData['member_id']);
                        if ($member) {
                            $contactNo = $contactNo ?: $member->mobile;
                            $name = $name ?: $member->member_name;
                            $fatherName = $fatherName ?: $member->father_name;
                            $nid = $nid ?: $member->nid;
                        }
                    }

                    LoanGuarantor::create([
                        'loan_application_id' => $application->id,
                        'guarantor_type' => $guarantorData['guarantor_type'],
                        'member_id' => $guarantorData['member_id'] ?? null,
                        'name' => $name,
                        'father_name' => $fatherName,
                        'husband_name' => $guarantorData['husband_name'] ?? null,
                        'relation' => $guarantorData['relation'] ?? null,
                        'address' => $guarantorData['address'] ?? null,
                        'contact_no' => $contactNo,
                        'nid' => $nid,
                        'image' => $imagePath,
                        'signature' => $signaturePath,
                        'nid_image' => $nidImagePath,
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Application updated successfully', 'data' => $application->load(['nominees', 'guarantors'])]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update application: ' . $e->getMessage()], 500);
        }
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
