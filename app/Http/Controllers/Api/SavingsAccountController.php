<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavingsAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SavingsAccountController extends Controller
{
    public function index()
    {
        $accounts = SavingsAccount::with(['member', 'product'])->latest()->get();
        return response()->json($accounts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_number' => 'required|string|min:12|unique:savings_accounts',
            'member_id' => 'required|exists:member_infos,id',
            'savings_product_id' => 'required|exists:savings_products,id',
            'status' => 'boolean',
            'opening_balance' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $validated['created_user_id'] = Auth::id();
        
        $account = SavingsAccount::create($validated);
        
        return response()->json($account, 201);
    }

    public function show($id)
    {
        $account = SavingsAccount::with(['member', 'product'])->findOrFail($id);
        return response()->json($account);
    }

    public function update(Request $request, $id)
    {
        $account = SavingsAccount::findOrFail($id);
        
        $validated = $request->validate([
            'account_number' => 'required|string|min:12|unique:savings_accounts,account_number,'.$id,
            'member_id' => 'required|exists:member_infos,id',
            'savings_product_id' => 'required|exists:savings_products,id',
            'status' => 'boolean',
            'opening_balance' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $validated['updated_user_id'] = Auth::id();

        $account->update($validated);
        
        return response()->json($account);
    }

    public function destroy($id)
    {
        $account = SavingsAccount::findOrFail($id);
        $account->delete();
        
        return response()->json(['message' => 'Account deleted successfully']);
    }
}
