<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $modelMap = [
            'department' => \App\Models\HR\Department::class,
            'designation' => \App\Models\HR\Designation::class,
            'shift' => \App\Models\HR\Shift::class,
            'holiday' => \App\Models\HR\Holiday::class,
            'employee' => \App\Models\HR\Employee::class,
        ];

        $query = AuditLog::with('user');

        if ($request->filled('auditable_type')) {
            $query->where('auditable_type', $request->auditable_type);
        }

        if ($request->filled('auditable_id')) {
            $query->where('auditable_id', $request->auditable_id);
        }

        if ($request->filled('model') && isset($modelMap[$request->model])) {
            $query->where('auditable_type', $modelMap[$request->model]);
        } else {
            $query->whereIn('auditable_type', array_values($modelMap));
        }

        $logs = $query->orderByDesc('id')->paginate(50);

        return response()->json($logs);
    }
}
