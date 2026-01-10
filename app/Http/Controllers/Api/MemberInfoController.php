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
    public function index()
    {
        if (!Auth::user()->can('member.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $members = MemberInfo::with(['creator', 'updator', 'samity', 'user', 'savingsAccounts.product'])->latest()->get();
        return response()->json($members);
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
            'mobile' => 'nullable|string|max:15',
            'email' => 'nullable|email|max:100', // Unique check is complex if nullable, handle manually for user
            'member_code' => 'nullable|string|unique:member_infos,member_code',
            'nid' => 'nullable|string|max:20',
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

                SavingsAccount::create([
                    'account_number' => $accountNumber,
                    'member_id' => $member->id,
                    'product_id' => $request->product_id,
                    'status' => 'active',
                    'principal_amount' => $request->principal_amount,
                    'current_balance' => $request->principal_amount,
                    'profit_balance' => 0,
                    'tenure_month' => $request->tenure_month,
                    'description' => $request->description ?? 'Opening Balance',
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
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
            'mobile' => 'nullable|string|max:15',
            'email' => 'nullable|email|max:100',
            'member_code' => 'nullable|string|unique:member_infos,member_code,' . $id,
            'nid' => 'nullable|string|max:20',
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
}
