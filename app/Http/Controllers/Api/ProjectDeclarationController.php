<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectDeclaration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProjectDeclarationController extends Controller
{
    public function index(Request $request)
    {
        $query = ProjectDeclaration::withCount('investors')
            ->with(['samity', 'investmentGl', 'investorFundGl', 'cashGl'])
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_code' => 'required|string|max:50|unique:project_declarations,project_code',
            'project_name' => 'required|string|max:255',
            'samity_id' => 'required|exists:samity_profiles,id',
            'description' => 'nullable|string',
            'declaration_date' => 'required|date',
            'total_shares' => 'required|numeric|min:1',
            'share_price' => 'required|numeric|min:0.01',
            'investment_gl_id' => 'required|integer',
            'investor_fund_gl_id' => 'required|integer',
            'cash_gl_id' => 'required|integer',
            'profit_distribution_gl_id' => 'required|integer',
            'samity_income_gl_id' => 'required|integer',
            'status' => 'required|in:draft,active,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $targetAmount = round($data['total_shares'] * $data['share_price'], 2);

        $project = ProjectDeclaration::create([
            ...$data,
            'target_amount' => $targetAmount,
            'available_share_qty' => $data['total_shares'],
            'created_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Project declared successfully',
            'data' => $project,
        ], 201);
    }

    public function show($id)
    {
        $project = ProjectDeclaration::with([
            'samity',
            'investmentGl',
            'investorFundGl',
            'cashGl',
            'profitDistributionGl',
            'samityIncomeGl',
            'investors.member',
            'closing',
        ])->find($id);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        return response()->json($project);
    }

    public function update(Request $request, $id)
    {
        $project = ProjectDeclaration::find($id);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        if ($project->status === 'closed') {
            return response()->json(['message' => 'Closed project cannot be updated'], 422);
        }

        $validator = Validator::make($request->all(), [
            'project_code' => 'sometimes|string|max:50|unique:project_declarations,project_code,' . $project->id,
            'project_name' => 'sometimes|string|max:255',
            'samity_id' => 'sometimes|exists:samity_profiles,id',
            'description' => 'nullable|string',
            'declaration_date' => 'sometimes|date',
            'total_shares' => 'sometimes|numeric|min:1',
            'share_price' => 'sometimes|numeric|min:0.01',
            'investment_gl_id' => 'sometimes|integer',
            'investor_fund_gl_id' => 'sometimes|integer',
            'cash_gl_id' => 'sometimes|integer',
            'profit_distribution_gl_id' => 'sometimes|integer',
            'samity_income_gl_id' => 'sometimes|integer',
            'status' => 'sometimes|in:draft,active,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $newTotalShares = array_key_exists('total_shares', $data) ? $data['total_shares'] : $project->total_shares;
        $newSharePrice = array_key_exists('share_price', $data) ? $data['share_price'] : $project->share_price;

        if ($newTotalShares < $project->sold_share_qty) {
            return response()->json(['message' => 'Total shares cannot be less than already sold shares'], 422);
        }

        $data['target_amount'] = round($newTotalShares * $newSharePrice, 2);
        $data['available_share_qty'] = round($newTotalShares - $project->sold_share_qty, 2);
        $data['updated_by'] = Auth::id();

        $project->update($data);

        return response()->json([
            'message' => 'Project updated successfully',
            'data' => $project->fresh(),
        ]);
    }

    public function investors($id)
    {
        $project = ProjectDeclaration::find($id);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        return response()->json(
            $project->investors()
                ->with('member.samity')
                ->orderByDesc('invested_amount')
                ->get()
        );
    }
}
