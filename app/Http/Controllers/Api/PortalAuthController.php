<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberInfo;
use App\Models\Role;
use App\Models\SamityProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Token-based auth for the member portal (separate front-end app).
 *
 * The portal is for members only (the "user" role). Registration creates a
 * pending account that an admin must approve (activate) before the member can
 * sign in.
 */
class PortalAuthController extends Controller
{
    /**
     * Self-registration: creates a disabled user + inactive member that an admin
     * approves from the admin panel.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:150|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $samity = SamityProfile::first();
        if (! $samity) {
            return response()->json(['message' => 'Registration is not available yet. Please contact the office.'], 422);
        }

        $userRole = Role::where('slug', 'user')->first();

        $user = DB::transaction(function () use ($data, $samity, $userRole) {
            // Pending account — cannot log in until an admin activates it.
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'status' => false,
            ]);

            if ($userRole) {
                $user->roles()->sync([$userRole->id]);
            }

            $member = MemberInfo::create([
                'samity_id' => $samity->id,
                'member_name' => $data['name'],
                'email' => $data['email'],
                'mobile' => $data['phone'] ?? null,
                'user_id' => $user->id,
                'is_active' => false,
                'created_by' => $user->id,
            ]);

            $member->update(['member_code' => 'M' . str_pad((string) $member->id, 5, '0', STR_PAD_LEFT)]);

            return $user;
        });

        return response()->json([
            'message' => 'Registration received. Your account is pending admin approval — you will be able to sign in once it is activated.',
            'user_id' => $user->id,
        ], 201);
    }

    /**
     * Member login — returns a Sanctum bearer token used by the portal.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Portal is for members only.
        if (! $user->hasRole('user')) {
            return response()->json(['message' => 'This portal is for members only.'], 403);
        }

        if (! $user->status) {
            return response()->json(['message' => 'Your account is pending approval or has been disabled.'], 403);
        }

        $token = $user->createToken('member-portal')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->presentUser($user),
        ]);
    }

    /** Current authenticated member. */
    public function me(Request $request)
    {
        return response()->json(['user' => $this->presentUser($request->user())]);
    }

    /** Revoke the current token. */
    public function logout(Request $request)
    {
        $token = $request->user()?->currentAccessToken();
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    /** User payload with roles, permissions and the linked member record. */
    private function presentUser(User $user): array
    {
        $user->load('roles.permissions');
        $member = MemberInfo::where('user_id', $user->id)->first();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roles,
            'member' => $member ? [
                'id' => $member->id,
                'member_code' => $member->member_code,
                'member_name' => $member->member_name,
                'samity_id' => $member->samity_id,
                'is_active' => (bool) $member->is_active,
                'mobile' => $member->mobile,
                'email' => $member->email,
            ] : null,
        ];
    }
}
