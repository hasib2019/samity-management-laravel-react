<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::with('roles')->get());
    }

    /** Only an existing super-admin may grant the all-powerful super-admin role. */
    private function isAssigningSuperAdmin(Request $request): bool
    {
        if (! $request->has('roles') || ! is_array($request->roles)) {
            return false;
        }

        $superAdminId = Role::where('slug', 'super-admin')->value('id');

        return $superAdminId && in_array((int) $superAdminId, array_map('intval', $request->roles), true);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'status' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'integer|exists:roles,id',
        ]);

        if ($this->isAssigningSuperAdmin($request) && ! $request->user()->hasRole('super-admin')) {
            return response()->json(['message' => 'You are not authorized to assign the Super Admin role.'], 403);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => $request->status ?? true,
        ]);

        if ($request->has('roles')) {
            $user->roles()->sync($request->roles);
        }

        return response()->json($user->load('roles'), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load('roles'));
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'status' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'integer|exists:roles,id',
        ]);

        if ($this->isAssigningSuperAdmin($request) && ! $request->user()->hasRole('super-admin')) {
            return response()->json(['message' => 'You are not authorized to assign the Super Admin role.'], 403);
        }

        $wasActive = (bool) $user->status;

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'status' => $request->status,
        ]);

        if ($request->has('password') && $request->password) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        if ($request->has('roles')) {
            $user->roles()->sync($request->roles);
        }

        // Revoke active tokens when an account is disabled so existing sessions stop working.
        if ($wasActive && $request->has('status') && ! $request->boolean('status')) {
            $user->tokens()->delete();
        }

        return response()->json($user->load('roles'));
    }

    public function destroy(User $user)
    {
        if ($user->hasRole('super-admin')) {
            return response()->json(['message' => 'Super Admin cannot be deleted'], 403);
        }
        
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }
}
