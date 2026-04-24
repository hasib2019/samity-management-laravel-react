<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        if (!Auth::user()->can('product.setup.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $query = Product::orderBy('id', 'desc');

        if ($request->has('type')) {
            $query->where('product_type', $request->type);
        }

        $products = $query->get();
        return response()->json($products);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->can('product.setup.create')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'product_code' => 'required|string|unique:product_mst,product_code',
            'product_name' => 'required|string',
            'product_type' => 'required|in:saving,share,fdr,dps,loan,member_loan',
            'product_category' => 'required|in:deposit,investment,credit',
            'rate_type' => 'nullable|string',
            'min_amount' => 'nullable|numeric',
            'max_amount' => 'nullable|numeric',
            'face_value' => 'nullable|numeric',
            'profit_rate' => 'nullable|numeric',
            'installment_amount' => 'nullable|numeric',
            'penalty_rate' => 'nullable|numeric',
            'sav_dep_lib_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'sav_penalty_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'sav_cash_bank_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'sav_interest_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'dps_dep_lib_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'dps_penalty_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'dps_cash_bank_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'dps_interest_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'fdr_dep_lib_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'fdr_penalty_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'fdr_cash_bank_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'fdr_interest_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'shr_capital_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'shr_cash_bank_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'shr_fee_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_portfolio_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_cash_bank_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_interest_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_penalty_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_waiver_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_loss_provision_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_portfolio_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_cash_bank_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_interest_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_penalty_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_waiver_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_loss_provision_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['created_by'] = Auth::id();
        
        $product = Product::create($data);

        return response()->json(['message' => 'Product created successfully', 'data' => $product], 201);
    }

    public function show($id)
    {
        if (!Auth::user()->can('product.setup.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $product = Product::find($id);
        if (!$product) return response()->json(['message' => 'Product not found'], 404);
        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        if (!Auth::user()->can('product.setup.edit')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::find($id);
        if (!$product) return response()->json(['message' => 'Product not found'], 404);

        $validator = Validator::make($request->all(), [
            'product_code' => 'required|string|unique:product_mst,product_code,' . $id,
            'product_name' => 'required|string',
            'product_type' => 'required|in:saving,share,fdr,dps,loan,member_loan',
            'product_category' => 'required|in:deposit,investment,credit',
            'rate_type' => 'nullable|string',
            'min_amount' => 'nullable|numeric',
            'max_amount' => 'nullable|numeric',
            'profit_rate' => 'nullable|numeric',
            'installment_amount' => 'nullable|numeric',
            'penalty_rate' => 'nullable|numeric',
            'sav_dep_lib_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'sav_penalty_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'sav_cash_bank_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'sav_interest_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'dps_dep_lib_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'dps_penalty_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'dps_cash_bank_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'dps_interest_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'fdr_dep_lib_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'fdr_penalty_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'fdr_cash_bank_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'fdr_interest_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'shr_capital_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'shr_cash_bank_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'shr_fee_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_portfolio_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_cash_bank_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_interest_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_penalty_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_waiver_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'loan_loss_provision_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_portfolio_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_cash_bank_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_interest_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_penalty_income_cr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_waiver_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'mem_loan_loss_provision_exp_dr_gl_id' => 'nullable|exists:glac_mst,id',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['updated_by'] = Auth::id();

        $product->update($data);

        return response()->json(['message' => 'Product updated successfully', 'data' => $product]);
    }

    public function destroy($id)
    {
        if (!Auth::user()->can('product.setup.delete')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::find($id);
        if (!$product) return response()->json(['message' => 'Product not found'], 404);

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }
}
