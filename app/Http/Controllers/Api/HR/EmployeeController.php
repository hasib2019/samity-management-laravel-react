<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with(['department', 'designation', 'supervisor']);
        if ($request->department_id) $query->where('department_id', $request->department_id);
        if ($request->designation_id) $query->where('designation_id', $request->designation_id);
        if ($request->status) $query->where('status', $request->status);
        $items = $query->latest()->paginate(20);
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:hr_employees,code',
            'full_name' => 'required|string|max:150',
            'email' => 'nullable|email|max:120',
            'department_id' => 'nullable|exists:hr_departments,id',
            'designation_id' => 'nullable|exists:hr_designations,id',
            'supervisor_id' => 'nullable|exists:hr_employees,id',
            'status' => 'nullable|string|in:active,inactive,terminated',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $emp = Employee::create(array_merge(
            $request->only([
                'code','full_name','dob','gender','marital_status','contact_phone','email','address',
                'join_date','confirm_date','resign_date','department_id','designation_id','supervisor_id',
                'employment_type','branch_id','status','nid','tin','bank_name','bank_branch','bank_account_no',
                'emergency_contact_name','emergency_contact_phone'
            ]),
            ['created_by' => Auth::id(), 'updated_by' => Auth::id()]
        ));

        return response()->json(['message' => 'Employee created', 'data' => $emp], 201);
    }

    public function show($id)
    {
        $emp = Employee::with(['department','designation','supervisor','documents'])->find($id);
        if (!$emp) return response()->json(['message' => 'Employee not found'], 404);
        return response()->json($emp);
    }

    public function update(Request $request, $id)
    {
        $emp = Employee::find($id);
        if (!$emp) return response()->json(['message' => 'Employee not found'], 404);

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:hr_employees,code,' . $id,
            'full_name' => 'required|string|max:150',
            'email' => 'nullable|email|max:120',
            'department_id' => 'nullable|exists:hr_departments,id',
            'designation_id' => 'nullable|exists:hr_designations,id',
            'supervisor_id' => 'nullable|exists:hr_employees,id',
            'status' => 'nullable|string|in:active,inactive,terminated',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $emp->update(array_merge(
            $request->only([
                'code','full_name','dob','gender','marital_status','contact_phone','email','address',
                'join_date','confirm_date','resign_date','department_id','designation_id','supervisor_id',
                'employment_type','branch_id','status','nid','tin','bank_name','bank_branch','bank_account_no',
                'emergency_contact_name','emergency_contact_phone'
            ]),
            ['updated_by' => Auth::id()]
        ));

        return response()->json(['message' => 'Employee updated', 'data' => $emp]);
    }

    public function destroy($id)
    {
        $emp = Employee::find($id);
        if (!$emp) return response()->json(['message' => 'Employee not found'], 404);
        $emp->delete();
        return response()->json(['message' => 'Employee deleted']);
    }

    public function uploadDocument(Request $request, $id)
    {
        $emp = Employee::find($id);
        if (!$emp) return response()->json(['message' => 'Employee not found'], 404);

        $validator = Validator::make($request->all(), [
            'type' => 'required|string|max:50',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('file');
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('hr_documents', $filename, 'public');

        $doc = EmployeeDocument::create([
            'employee_id' => $emp->id,
            'type' => $request->type,
            'file_path' => $path,
            'uploaded_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Document uploaded', 'data' => $doc], 201);
    }
}
