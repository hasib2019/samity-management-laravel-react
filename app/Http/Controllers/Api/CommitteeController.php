<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Committee;
use App\Models\CommitteeMember;
use App\Models\CommitteeDocument;
use App\Models\CommitteeType;
use App\Models\MemberInfo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CommitteeController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:committee.view')->only(['index', 'show']);
        $this->middleware('permission:committee.create')->only(['store']);
        $this->middleware('permission:committee.edit')->only(['update']);
        $this->middleware('permission:committee.delete')->only(['destroy']);
        $this->middleware('permission:committee.approve')->only(['approve']);
    }

    public function index(Request $request)
    {
        $query = Committee::with(['samity', 'committeeType', 'members.memberInfo', 'documents']);

        if ($request->samity_id) {
            $query->where('samity_id', $request->samity_id);
        }

        if ($request->committee_type_id) {
            $query->where('committee_type_id', $request->committee_type_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $committees = $query->latest()->paginate(20);
        return response()->json($committees);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'samity_id' => 'required|exists:samity_profiles,id',
            'committee_type_id' => 'required|exists:committee_types,id',
            'name' => 'required|string',
            'name_bn' => 'nullable|string',
            'meeting_date' => 'nullable|date',
            'election_date' => 'nullable|date',
            'effective_date' => 'required|date',
            'member_count' => 'required|integer|in:3,6,9,12',
            'members' => 'required|array|min:1',
            'members.*.member_info_id' => 'required|exists:member_infos,id',
            'members.*.designation' => 'required|string',
            'documents' => 'nullable|array',
            'documents.*.file' => 'required_with:documents|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120',
            'documents.*.document_type' => 'required_with:documents|string',
            'documents.*.document_name' => 'required_with:documents|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Get committee type for validity period
            $committeeType = CommitteeType::findOrFail($request->committee_type_id);
            $effectiveDate = Carbon::parse($request->effective_date);
            $endDate = $effectiveDate->copy()->addYears($committeeType->validity_period);

            // Create Committee
            $committee = Committee::create([
                'samity_id' => $request->samity_id,
                'committee_type_id' => $request->committee_type_id,
                'name' => $request->name,
                'name_bn' => $request->name_bn,
                'meeting_date' => $request->meeting_date,
                'election_date' => $request->election_date,
                'effective_date' => $effectiveDate,
                'end_date' => $endDate,
                'member_count' => $request->member_count,
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            // Add Members
            if ($request->has('members')) {
                foreach ($request->members as $index => $memberData) {
                    CommitteeMember::create([
                        'committee_id' => $committee->id,
                        'member_info_id' => $memberData['member_info_id'],
                        'designation' => $memberData['designation'],
                        'position' => $index + 1,
                        'mobile' => $memberData['mobile'] ?? null,
                        'email' => $memberData['email'] ?? null,
                    ]);
                }
            }

            // Upload Documents
            if ($request->has('documents')) {
                foreach ($request->documents as $doc) {
                    if ($request->hasFile('documents')) {
                        $file = $doc['file'];
                        $fileName = time() . '_' . $file->getClientOriginalName();
                        $filePath = $file->storeAs('committee_documents', $fileName, 'public');

                        CommitteeDocument::create([
                            'committee_id' => $committee->id,
                            'document_name' => $doc['document_name'],
                            'document_type' => $doc['document_type'],
                            'file_path' => $filePath,
                            'file_name' => $fileName,
                            'file_size' => $file->getSize(),
                            'uploaded_by' => Auth::id(),
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Committee created successfully',
                'data' => $committee->load(['samity', 'committeeType', 'members.memberInfo', 'documents'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $committee = Committee::with(['samity', 'committeeType', 'members.memberInfo', 'documents', 'elections'])
            ->find($id);

        if (!$committee) {
            return response()->json(['message' => 'Committee not found'], 404);
        }

        return response()->json($committee);
    }

    public function update(Request $request, $id)
    {
        $committee = Committee::find($id);

        if (!$committee) {
            return response()->json(['message' => 'Committee not found'], 404);
        }

        if ($committee->status !== 'draft') {
            return response()->json(['message' => 'Can only edit draft committees'], 400);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'name_bn' => 'nullable|string',
            'meeting_date' => 'nullable|date',
            'election_date' => 'nullable|date',
            'effective_date' => 'required|date',
            'member_count' => 'required|integer|in:3,6,9,12',
            'members' => 'required|array|min:1',
            'members.*.member_info_id' => 'required|exists:member_infos,id',
            'members.*.designation' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $committeeType = CommitteeType::findOrFail($committee->committee_type_id);
            $effectiveDate = Carbon::parse($request->effective_date);
            $endDate = $effectiveDate->copy()->addYears($committeeType->validity_period);

            $committee->update([
                'name' => $request->name,
                'name_bn' => $request->name_bn,
                'meeting_date' => $request->meeting_date,
                'election_date' => $request->election_date,
                'effective_date' => $effectiveDate,
                'end_date' => $endDate,
                'member_count' => $request->member_count,
                'updated_by' => Auth::id(),
            ]);

            // Update Members
            CommitteeMember::where('committee_id', $committee->id)->delete();
            foreach ($request->members as $index => $memberData) {
                CommitteeMember::create([
                    'committee_id' => $committee->id,
                    'member_info_id' => $memberData['member_info_id'],
                    'designation' => $memberData['designation'],
                    'position' => $index + 1,
                    'mobile' => $memberData['mobile'] ?? null,
                    'email' => $memberData['email'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Committee updated successfully',
                'data' => $committee->load(['samity', 'committeeType', 'members.memberInfo', 'documents'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $committee = Committee::find($id);

        if (!$committee) {
            return response()->json(['message' => 'Committee not found'], 404);
        }

        if ($committee->status !== 'draft') {
            return response()->json(['message' => 'Can only delete draft committees'], 400);
        }

        try {
            DB::beginTransaction();

            // Delete documents
            foreach ($committee->documents as $doc) {
                Storage::disk('public')->delete($doc->file_path);
                $doc->delete();
            }

            // Delete members
            CommitteeMember::where('committee_id', $id)->delete();

            // Delete committee
            $committee->delete();

            DB::commit();

            return response()->json(['message' => 'Committee deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function submit($id)
    {
        $committee = Committee::find($id);

        if (!$committee) {
            return response()->json(['message' => 'Committee not found'], 404);
        }

        if ($committee->status !== 'draft') {
            return response()->json(['message' => 'Only draft committees can be submitted'], 400);
        }

        // Validate committee has required data
        if ($committee->members()->count() !== $committee->member_count) {
            return response()->json(['message' => 'Committee must have exactly ' . $committee->member_count . ' members'], 400);
        }

        try {
            $committee->update(['status' => 'submitted']);
            return response()->json([
                'message' => 'Committee submitted successfully',
                'data' => $committee
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function approve(Request $request, $id)
    {
        $committee = Committee::find($id);

        if (!$committee) {
            return response()->json(['message' => 'Committee not found'], 404);
        }

        if ($committee->status !== 'submitted') {
            return response()->json(['message' => 'Only submitted committees can be approved'], 400);
        }

        try {
            $committee->update([
                'status' => 'approved',
                'remarks' => $request->remarks,
                'updated_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Committee approved successfully',
                'data' => $committee
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        $committee = Committee::find($id);

        if (!$committee) {
            return response()->json(['message' => 'Committee not found'], 404);
        }

        if ($committee->status !== 'submitted') {
            return response()->json(['message' => 'Only submitted committees can be rejected'], 400);
        }

        try {
            $committee->update([
                'status' => 'rejected',
                'remarks' => $request->remarks ?? '',
                'updated_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Committee rejected successfully',
                'data' => $committee
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getAvailableMembers(Request $request)
    {
        $samityId = $request->samity_id;

        $members = MemberInfo::where('samity_id', $samityId)
            ->where('status', 'active')
            ->select('id', 'member_code', 'member_name', 'mobile')
            ->get();

        return response()->json($members);
    }
}
