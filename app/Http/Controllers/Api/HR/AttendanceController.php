<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::with('employee');
        if ($request->filled('employee_id')) $query->where('employee_id', $request->employee_id);
        if ($request->filled('date')) $query->where('date', $request->date);
        if ($request->filled('from')) $query->where('date', '>=', $request->from);
        if ($request->filled('to')) $query->where('date', '<=', $request->to);
        $items = $query->latest()->paginate(20);
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:hr_employees,id',
            'date' => 'required|date',
            'status' => 'required|string|in:present,absent,leave,half',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'remarks' => 'nullable|string|max:200',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $att = Attendance::create(array_merge(
            $request->only(['employee_id','date','status','check_in','check_out','remarks']),
            ['created_by' => Auth::id(), 'updated_by' => Auth::id()]
        ));

        return response()->json(['message' => 'Attendance recorded', 'data' => $att], 201);
    }

    public function show($id)
    {
        $att = Attendance::with('employee')->find($id);
        if (!$att) return response()->json(['message' => 'Attendance not found'], 404);
        return response()->json($att);
    }

    public function update(Request $request, $id)
    {
        $att = Attendance::find($id);
        if (!$att) return response()->json(['message' => 'Attendance not found'], 404);

        $validator = Validator::make($request->all(), [
            'status' => 'nullable|string|in:present,absent,leave,half',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'remarks' => 'nullable|string|max:200',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $att->update(array_merge(
            $request->only(['status','check_in','check_out','remarks']),
            ['updated_by' => Auth::id()]
        ));

        return response()->json(['message' => 'Attendance updated', 'data' => $att]);
    }

    public function destroy($id)
    {
        $att = Attendance::find($id);
        if (!$att) return response()->json(['message' => 'Attendance not found'], 404);
        $att->delete();
        return response()->json(['message' => 'Attendance deleted']);
    }
}
