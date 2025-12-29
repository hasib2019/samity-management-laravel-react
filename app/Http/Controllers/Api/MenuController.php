<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

use App\Models\AuditLog;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    public function index()
    {
        $menus = Menu::with(['children', 'permissions'])
            ->whereNull('parent_id')
            ->orderBy('order')
            ->get();
            
        return response()->json($menus);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:menus,id',
            'order' => 'integer',
        ]);

        return DB::transaction(function () use ($request) {
            $menu = Menu::create([
                'name' => $request->name,
                'slug' => Str::slug($request->name),
                'icon' => $request->icon,
                'parent_id' => $request->parent_id,
                'order' => $request->order ?? 0,
                'is_hidden' => true, // Default hidden for security
            ]);

            // Auto-create basic view permission for the new menu
            Permission::create([
                'name' => $menu->name . ' View',
                'slug' => $menu->slug . '.view',
                'menu_id' => $menu->id,
            ]);

            $this->logAudit('create', $menu, null, $menu->toArray());

            return response()->json($menu->load('permissions'), 201);
        });
    }

    public function update(Request $request, Menu $menu)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:menus,id',
            'order' => 'integer',
            'is_hidden' => 'boolean',
        ]);

        $oldValues = $menu->toArray();

        $menu->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'icon' => $request->icon,
            'parent_id' => $request->parent_id,
            'order' => $request->order,
            'is_hidden' => $request->is_hidden ?? $menu->is_hidden,
        ]);

        $this->logAudit('update', $menu, $oldValues, $menu->toArray());

        return response()->json($menu);
    }

    public function destroy(Menu $menu)
    {
        $oldValues = $menu->toArray();
        $menu->delete();
        
        $this->logAudit('delete', $menu, $oldValues, null);
        
        return response()->json(['message' => 'Menu deleted successfully']);
    }

    protected function logAudit($action, $model, $oldValues, $newValues)
    {
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
