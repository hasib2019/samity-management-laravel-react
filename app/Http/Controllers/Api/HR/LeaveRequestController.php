<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class LeaveRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = LeaveRequest::with(['employee','type']);
        if ($request->filled('employee_id')) $query->where('employee_id', $request->employee_id);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('from')) $query->where('date_from', '>=', $request->from);
        if ($request->filled('to')) $query->where('date_to', '<=', $request->to);
        $items = $query->latest()->paginate(20);
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:hr_employees,id',
            'leave_type_id' => 'required|exists:hr_leave_types,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'reason' => 'nullable|string|max:200',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $from = Carbon::parse($request->date_from);
        $to = Carbon::parse($request->date_to);
        $days = $from->diffInDays($to) + 1;

        $item = LeaveRequest::create([
            'employee_id' => $request->employee_id,
            'leave_type_id' => $request->leave_type_id,
            'date_from' => $from->toDateString(),
            'date_to' => $to->toDateString(),
            'days' => $days,
            'reason' => $request->reason,
            'status' => 'pending',
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Leave request submitted', 'data' => $item], 201);
    }

    public function approve($id)
    {
        $item = LeaveRequest::find($id);
        if (!$item) return response()->json(['message' => 'Leave request not found'], 404);
        if ($item->status !== 'pending') return response()->json(['message' => 'Only pending requests can be approved'], 422);

        $item->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Leave approved', 'data' => $item]);
    }

    public function reject(Request $request, $id)
    {
        $item = LeaveRequest::find($id);
        if (!$item) return response()->json(['message' => 'Leave request not found'], 404);
        if ($item->status !== 'pending') return response()->json(['message' => 'Only pending requests can be rejected'], 422);

        $item->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Leave rejected', 'data' => $item]);
    }

    public function destroy($id)
    {
        $item = LeaveRequest::find($id);
        if (!$item) return response()->json(['message' => 'Leave request not found'], 404);
        $item->delete();
        return response()->json(['message' => 'Leave request deleted']);
    }
}
