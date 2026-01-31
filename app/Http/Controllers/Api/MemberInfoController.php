<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MemberInfo;
use App\Models\SavingsAccount;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MemberInfoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if (!Auth::user()->can('member.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = MemberInfo::with(['creator', 'updator', 'samity', 'user', 'savingsAccounts.product'])->latest();



        if ($request->has('samity_id')) {
            $query->where('samity_id', $request->samity_id);
        }

        $members = $query->get();
        return response()->json($members);
    }

    public function getAccounts($memberId)
    {
        $accounts = SavingsAccount::where('member_id', $memberId)->with('product')->get();
        return response()->json($accounts);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!Auth::user()->can('member.create')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'samity_id' => 'required|integer',
            'member_name' => 'required|string|max:150', 
            'member_name_bangla' => 'nullable|string|max:255',
            'father_name' => 'nullable|string|max:150',
            'mother_name' => 'nullable|string|max:150',
            'spouse_name' => 'nullable|string|max:150',
            'mobile' => 'required|string|max:15',
            'email' => 'nullable|email|max:100',
            'member_code' => 'nullable|string|unique:member_infos,member_code',
            'nid' => 'nullable|string|max:20',
            'dob' => 'nullable|date',
            'member_admission_date' => 'nullable|date',
            'gender_id' => 'nullable|integer',
            'marital_status_id' => 'nullable|integer',
            'education_level_id' => 'nullable|integer',
            'occupation_id' => 'nullable|integer',
            'religion_id' => 'nullable|integer',
            'brn' => 'nullable|string|max:50',
            'doptor_id' => 'nullable|integer',
            'ref_samity_id' => 'nullable|integer',
            'no_of_share' => 'nullable|integer',
            'share_price' => 'nullable|numeric',
            'committee_organizer' => 'nullable|in:Y,N',
            'committee_contact_person' => 'nullable|in:Y,N',
            'committee_signatory_person' => 'nullable|in:Y,N',
            'member_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'member_sign' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'nid_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // 1. Create User
            $email = $request->email;
            if (empty($email)) {
                // Generate a dummy email if not provided, as User table requires it
                // using mobile or member_code or random
                $identifier = $request->mobile ?? $request->member_code ?? uniqid();
                $email = $identifier . '@local.com';
            }
            
            // Check if user with this email exists
            if (User::where('email', $email)->exists()) {
                // If generated, append random
                 if (empty($request->email)) {
                    $email = uniqid() . $email;
                 } else {
                     return response()->json(['errors' => ['email' => ['The email has already been taken.']]], 422);
                 }
            }

            $user = User::create([
                'name' => $request->member_name,
                'email' => $email,
                'password' => Hash::make('123456'),
            ]);

            // 2. Handle File Uploads
            $data = $request->except(['member_photo', 'member_sign', 'nid_photo']);
            
            if ($request->hasFile('member_photo')) {
                $path = $request->file('member_photo')->store('member_photos', 'public');
                $data['member_photo'] = $path;
            }
            
            if ($request->hasFile('member_sign')) {
                $path = $request->file('member_sign')->store('member_signs', 'public');
                $data['member_sign'] = $path;
            }

            if ($request->hasFile('nid_photo')) {
                $path = $request->file('nid_photo')->store('nid_photos', 'public');
                $data['nid_photo'] = $path;
            }

            $data['created_by'] = Auth::id();
            $data['updated_by'] = Auth::id();
            $data['user_id'] = $user->id;
            // Set default is_samity_member if not present (though validation handles boolean casting, explicit default is safe)
            if (!isset($data['is_samity_member'])) {
                $data['is_samity_member'] = true;
            }

            $member = MemberInfo::create($data);

            // 3. Handle Savings Account Creation
            if ($request->boolean('account_details')) {
                // Validate account specific fields
                $accountValidator = Validator::make($request->all(), [
                    'product_id' => 'required|exists:product_mst,id',
                    'principal_amount' => 'required|numeric|min:0',
                    'tenure_month' => 'nullable|integer|min:1',
                ]);

                if ($accountValidator->fails()) {
                    throw new \Exception(implode(', ', $accountValidator->errors()->all()));
                }

                // Retrieve Product and GL Info
                $product = \App\Models\Product::find($request->product_id);
                if (!$product->gl_income_id || !$product->gl_expense_id) {
                    throw new \Exception('Product GL Mapping (Income/Expense) is missing. Cannot create account.');
                }

                // Generate Account Number: YYYYMMDD + 4 digit serial
                $prefix = date('Ymd');
                $lastAccount = SavingsAccount::where('account_number', 'like', $prefix . '%')
                    ->orderBy('account_number', 'desc')
                    ->first();
                
                $nextSerial = 1;
                if ($lastAccount) {
                    $lastSerial = (int)substr($lastAccount->account_number, -4);
                    $nextSerial = $lastSerial + 1;
                }
                
                $accountNumber = $prefix . str_pad($nextSerial, 4, '0', STR_PAD_LEFT);

                $savingsAccount = SavingsAccount::create([
                    'account_number' => $accountNumber,
                    'member_id' => $member->id,
                    'product_id' => $request->product_id,
                    'status' => true,
                    'principal_amount' => $request->principal_amount,
                    'current_balance' => $request->principal_amount,
                    'profit_balance' => 0,
                    'tenure_month' => $request->tenure_month,
                    'description' => $request->description ?? 'Opening Balance',
                    'created_user_id' => Auth::id(),
                    'updated_user_id' => Auth::id(),
                ]);

                // Transaction Creation
                // Unique batch_num: sav+5digit (Same for both transactions)
                do {
                    $batchNum = 'sav' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
                } while (\App\Models\Transaction::where('batch_num', $batchNum)->exists());

                $commonData = [
                    'customer_id' => $savingsAccount->id,
                    'samity_id' => $member->samity_id,
                    'product_id' => $product->id,
                    'payment_mode' => 'cash',
                    'batch_num' => $batchNum,
                    'tran_code' => 'DEP',
                    'tran_type' => 'Deposit',
                    'tran_date' => date('Y-m-d'),
                    'naration' => 'Account opening',
                    'authorize_status' => 'approved',
                    'authorized_by' => Auth::id(),
                    'authorized_at' => date('Y-m-d'),
                    'created_by' => Auth::id(),
                    'status' => 'posted',
                ];

                // Debit Transaction (Using gl_expense_id)
                // Generate Unique tran_num for Debit (Time based)
                $tranNumDr = date('YmdHis') . rand(10, 99);

                \App\Models\Transaction::create(array_merge($commonData, [
                    'tran_num' => $tranNumDr,
                    'glac_id' => $product->gl_expense_id,
                    'dr_amt' => $request->principal_amount,
                    'cr_amt' => 0,
                ]));

                // Credit Transaction (Using gl_income_id)
                // Generate Unique tran_num for Credit (Time based)
                $tranNumCr = date('YmdHis') . rand(10, 99);

                $creditTransaction = \App\Models\Transaction::create(array_merge($commonData, [
                    'tran_num' => $tranNumCr,
                    'glac_id' => $product->gl_income_id,
                    'dr_amt' => 0,
                    'cr_amt' => $request->principal_amount,
                ]));

                // Create Deposit Request Entry (Linked to Credit Transaction)
                \App\Models\DepositRequest::create([
                    'member_id' => $member->id,
                    'savings_account_id' => $savingsAccount->id,
                    'amount' => $request->principal_amount,
                    'total_amount' => $request->principal_amount,
                    'charge' => 0,
                    'description' => 'Account opening initial deposit',
                    'status' => 'approved',
                    'transaction_id' => $creditTransaction->id,
                ]);
                
            }

            DB::commit();

            return response()->json(['message' => 'Member created successfully', 'data' => $member], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create member: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        if (!Auth::user()->can('member.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $member = MemberInfo::with(['creator', 'updator', 'samity'])->find($id);

        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        return response()->json($member);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        if (!Auth::user()->can('member.edit')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $member = MemberInfo::find($id);

        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'samity_id' => 'required|integer',
            'member_name' => 'required|string|max:150',
            'member_name_bangla' => 'nullable|string|max:255',
            'father_name' => 'nullable|string|max:150',
            'mother_name' => 'nullable|string|max:150',
            'spouse_name' => 'nullable|string|max:150',
            'mobile' => 'required|string|max:15',
            'email' => 'nullable|email|max:100',
            'member_code' => 'nullable|string|unique:member_infos,member_code,' . $id,
            'nid' => 'nullable|string|max:20',
            'dob' => 'nullable|date',
            'member_admission_date' => 'nullable|date',
            'gender_id' => 'nullable|integer',
            'marital_status_id' => 'nullable|integer',
            'education_level_id' => 'nullable|integer',
            'occupation_id' => 'nullable|integer',
            'religion_id' => 'nullable|integer',
            'brn' => 'nullable|string|max:50',
            'doptor_id' => 'nullable|integer',
            'ref_samity_id' => 'nullable|integer',
            'no_of_share' => 'nullable|integer',
            'share_price' => 'nullable|numeric',
            'committee_organizer' => 'nullable|in:Y,N',
            'committee_contact_person' => 'nullable|in:Y,N',
            'committee_signatory_person' => 'nullable|in:Y,N',
            'member_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'member_sign' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'nid_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except(['member_photo', 'member_sign', 'nid_photo']);
        
        if ($request->hasFile('member_photo')) {
            if ($member->member_photo) {
                Storage::disk('public')->delete($member->member_photo);
            }
            $path = $request->file('member_photo')->store('member_photos', 'public');
            $data['member_photo'] = $path;
        }
        
        if ($request->hasFile('member_sign')) {
            if ($member->member_sign) {
                Storage::disk('public')->delete($member->member_sign);
            }
            $path = $request->file('member_sign')->store('member_signs', 'public');
            $data['member_sign'] = $path;
        }

        if ($request->hasFile('nid_photo')) {
            if ($member->nid_photo) {
                Storage::disk('public')->delete($member->nid_photo);
            }
            $path = $request->file('nid_photo')->store('nid_photos', 'public');
            $data['nid_photo'] = $path;
        }

        $data['updated_by'] = Auth::id();

        $member->update($data);

        return response()->json(['message' => 'Member updated successfully', 'data' => $member]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        if (!Auth::user()->can('member.delete')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $member = MemberInfo::find($id);

        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        $member->delete();

        return response()->json(['message' => 'Member deleted successfully']);
    }

    public function storeAccount(Request $request, $id)
    {
        $member = MemberInfo::find($id);
        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        // Validate account specific fields
        $accountValidator = Validator::make($request->all(), [
            'product_id' => 'required|exists:product_mst,id',
            'principal_amount' => 'required|numeric|min:0',
            'tenure_month' => 'nullable|integer|min:1',
        ]);

        if ($accountValidator->fails()) {
            return response()->json(['errors' => $accountValidator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Retrieve Product and GL Info
            $product = \App\Models\Product::find($request->product_id);
            if (!$product->gl_income_id || !$product->gl_expense_id) {
                throw new \Exception('Product GL Mapping (Income/Expense) is missing. Cannot create account.');
            }

            // Generate Account Number: YYYYMMDD + 4 digit serial
            $prefix = date('Ymd');
            $lastAccount = SavingsAccount::where('account_number', 'like', $prefix . '%')
                ->orderBy('account_number', 'desc')
                ->first();
            
            $nextSerial = 1;
            if ($lastAccount) {
                $lastSerial = (int)substr($lastAccount->account_number, -4);
                $nextSerial = $lastSerial + 1;
            }
            
            $accountNumber = $prefix . str_pad($nextSerial, 4, '0', STR_PAD_LEFT);

            $savingsAccount = SavingsAccount::create([
                'account_number' => $accountNumber,
                'member_id' => $member->id,
                'product_id' => $request->product_id,
                'status' => true,
                'principal_amount' => $request->principal_amount,
                'current_balance' => $request->principal_amount,
                'profit_balance' => 0,
                'tenure_month' => $request->tenure_month,
                'description' => $request->description ?? 'Opening Balance',
                'created_user_id' => Auth::id(),
                'updated_user_id' => Auth::id(),
            ]);

            // Transaction Creation
            do {
                $batchNum = 'sav' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            } while (\App\Models\Transaction::where('batch_num', $batchNum)->exists());

            $commonData = [
                'customer_id' => $savingsAccount->id,
                'samity_id' => $member->samity_id,
                'product_id' => $product->id,
                'payment_mode' => 'cash',
                'batch_num' => $batchNum,
                'tran_code' => 'DEP',
                'tran_type' => 'Deposit',
                'tran_date' => date('Y-m-d'),
                'naration' => 'Account opening',
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => date('Y-m-d'),
                'created_by' => Auth::id(),
                'status' => 'posted',
            ];

            // Debit Transaction (Using gl_expense_id)
            $tranNumDr = date('YmdHis') . rand(10, 99);

            \App\Models\Transaction::create(array_merge($commonData, [
                'tran_num' => $tranNumDr,
                'glac_id' => $product->gl_expense_id,
                'dr_amt' => $request->principal_amount,
                'cr_amt' => 0,
            ]));

            // Credit Transaction (Using gl_income_id)
            $tranNumCr = date('YmdHis') . rand(10, 99);

            $creditTransaction = \App\Models\Transaction::create(array_merge($commonData, [
                'tran_num' => $tranNumCr,
                'glac_id' => $product->gl_income_id,
                'dr_amt' => 0,
                'cr_amt' => $request->principal_amount,
            ]));

            // Create Deposit Request Entry (Linked to Credit Transaction)
            \App\Models\DepositRequest::create([
                'member_id' => $member->id,
                'savings_account_id' => $savingsAccount->id,
                'amount' => $request->principal_amount,
                'transaction_id' => $creditTransaction->id,
                'status' => 'approved',
                'request_date' => date('Y-m-d'),
                'approved_by' => Auth::id(),
                'approved_date' => date('Y-m-d'),
            ]);

            DB::commit();

            return response()->json(['message' => 'Savings account created successfully', 'data' => $savingsAccount]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create savings account', 'error' => $e->getMessage()], 500);
        }
    }
}
