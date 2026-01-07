<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SavingsProduct;
use Illuminate\Support\Facades\Validator;

class SavingsProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $products = SavingsProduct::latest()->get();
        return response()->json($products);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'currency_id' => 'required|string|max:10',
            'interest_rate' => 'required|numeric|min:0',
            'interest_method' => 'required|string|in:daily_outstanding_balance',
            'interest_period' => 'required|integer|in:1,3,6,12',
            'interest_posting_period' => 'nullable|integer',
            'min_bal_interest_rate' => 'required|numeric|min:0',
            'allow_withdraw' => 'required|boolean',
            'minimum_account_balance' => 'required|numeric|min:0',
            'minimum_deposit_amount' => 'required|numeric|min:0',
            'maintenance_fee' => 'required|numeric|min:0',
            'maintenance_fee_posting_period' => 'nullable|string',
            'status' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = SavingsProduct::create($request->all());

        return response()->json(['message' => 'Savings Product created successfully', 'data' => $product], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $product = SavingsProduct::find($id);

        if (!$product) {
            return response()->json(['message' => 'Savings Product not found'], 404);
        }

        return response()->json($product);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $product = SavingsProduct::find($id);

        if (!$product) {
            return response()->json(['message' => 'Savings Product not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'currency_id' => 'required|string|max:10',
            'interest_rate' => 'required|numeric|min:0',
            'interest_method' => 'required|string|in:daily_outstanding_balance',
            'interest_period' => 'required|integer|in:1,3,6,12',
            'interest_posting_period' => 'nullable|integer',
            'min_bal_interest_rate' => 'required|numeric|min:0',
            'allow_withdraw' => 'required|boolean',
            'minimum_account_balance' => 'required|numeric|min:0',
            'minimum_deposit_amount' => 'required|numeric|min:0',
            'maintenance_fee' => 'required|numeric|min:0',
            'maintenance_fee_posting_period' => 'nullable|string',
            'status' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product->update($request->all());

        return response()->json(['message' => 'Savings Product updated successfully', 'data' => $product]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $product = SavingsProduct::find($id);

        if (!$product) {
            return response()->json(['message' => 'Savings Product not found'], 404);
        }

        $product->delete();

        return response()->json(['message' => 'Savings Product deleted successfully']);
    }
}
