<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PermissionController extends Controller
{
    public function index()
    {
        return response()->json(Permission::with('menu')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:permissions',
            'menu_id' => 'required|exists:menus,id',
        ]);

        $permission = Permission::create([
            'name' => $request->name,
            'slug' => Str::slug($request->slug, '.'),
            'menu_id' => $request->menu_id,
        ]);

        return response()->json($permission, 201);
    }

    public function show(Permission $permission)
    {
        return response()->json($permission->load('menu'));
    }

    public function update(Request $request, Permission $permission)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:permissions,slug,' . $permission->id,
            'menu_id' => 'required|exists:menus,id',
        ]);

        $permission->update([
            'name' => $request->name,
            'slug' => Str::slug($request->slug, '.'),
            'menu_id' => $request->menu_id,
        ]);

        return response()->json($permission);
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();
        return response()->json(['message' => 'Permission deleted successfully']);
    }
}
