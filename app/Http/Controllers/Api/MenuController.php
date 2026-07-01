<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
            'name_bn' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:menus,id',
            'order' => 'integer',
        ]);

        return DB::transaction(function () use ($request) {
            $menu = Menu::create([
                'name' => $request->name,
                'name_bn' => $request->name_bn,
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

            return response()->json($menu->load('permissions'), 201);
        });
    }

    public function update(Request $request, Menu $menu)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'name_bn' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:menus,id',
            'order' => 'integer',
            'is_hidden' => 'boolean',
        ]);

        $oldValues = $menu->toArray();

        $menu->update([
            'name' => $request->name,
            'name_bn' => $request->name_bn,
            'slug' => Str::slug($request->name),
            'icon' => $request->icon,
            'parent_id' => $request->parent_id,
            'order' => $request->order,
            'is_hidden' => $request->is_hidden ?? $menu->is_hidden,
        ]);

        return response()->json($menu);
    }

    public function destroy(Menu $menu)
    {
        $menu->delete();
        
        return response()->json(['message' => 'Menu deleted successfully']);
    }
}
