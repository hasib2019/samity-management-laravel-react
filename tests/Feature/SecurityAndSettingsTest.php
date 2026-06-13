<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityAndSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed only the structure these tests need, in dependency order.
        // (The full DatabaseSeeder is skipped: FdrMenuSeeder has a pre-existing
        // role/permission FK bug on a fresh seed — noted as a separate finding.)
        $this->seed(\Database\Seeders\MenuSeeder::class);
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        $this->seed(\Database\Seeders\GeneralSettingMenuSeeder::class);
        $this->seed(\Database\Seeders\GeneralSettingPermissionSeeder::class);
        $this->seed(\Database\Seeders\GeneralSettingSeeder::class);
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\UserSeeder::class);
    }

    private function superAdmin(): User
    {
        return User::where('email', 'superadmin@example.com')->firstOrFail();
    }

    private function makeUser(string $email, bool $status = true, ?string $roleSlug = null): User
    {
        $user = User::create([
            'name' => $email,
            'email' => $email,
            'password' => Hash::make('password'),
            'status' => $status,
        ]);

        if ($roleSlug) {
            $user->roles()->attach(Role::where('slug', $roleSlug)->value('id'));
        }

        return $user;
    }

    // ---- WS6: cookie/session auth ----

    public function test_login_returns_user_and_menus_without_exposing_a_token(): void
    {
        // The SPA always issues same-origin requests (Origin header present), which
        // Sanctum treats as stateful/session auth.
        $resp = $this->postJson('/api/login', [
            'email' => 'superadmin@example.com',
            'password' => 'password',
        ], ['Origin' => 'http://localhost']);

        $resp->assertOk()->assertJsonStructure(['user', 'menus']);
        $resp->assertJsonMissingPath('access_token'); // token is no longer handed to JS
    }

    public function test_login_then_me_works_via_session_cookie(): void
    {
        // Sanctum treats requests carrying a stateful Origin as SPA/session requests.
        $headers = ['Origin' => 'http://localhost'];

        $this->postJson('/api/login', [
            'email' => 'superadmin@example.com',
            'password' => 'password',
        ], $headers)->assertOk();

        $this->getJson('/api/me', $headers)->assertOk()->assertJsonStructure(['user', 'menus']);
        $this->postJson('/api/logout', [], $headers)->assertOk();
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $this->postJson('/api/login', [
            'email' => 'superadmin@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_disabled_account_cannot_login(): void
    {
        $this->makeUser('disabled@example.com', status: false);

        $this->postJson('/api/login', [
            'email' => 'disabled@example.com',
            'password' => 'password',
        ])->assertStatus(403);
    }

    public function test_disabled_account_is_rejected_after_authentication(): void
    {
        $user = $this->makeUser('later-disabled@example.com', status: true, roleSlug: 'super-admin');
        $user->update(['status' => false]);

        Sanctum::actingAs($user);
        $this->getJson('/api/me')->assertStatus(403); // EnsureUserIsActive middleware
    }

    // ---- General Settings feature ----

    public function test_general_settings_index_returns_all_groups(): void
    {
        Sanctum::actingAs($this->superAdmin());

        $this->getJson('/api/general-settings')
            ->assertOk()
            ->assertJsonStructure(['data' => ['site_identity', 'localization', 'financial_defaults', 'notifications']]);
    }

    public function test_general_settings_update_persists_and_is_whitelisted(): void
    {
        Sanctum::actingAs($this->superAdmin());

        $this->postJson('/api/general-settings', [
            'settings' => [
                'site_name' => 'Test Coop Ltd',
                'currency_code' => 'USD',
                'unknown_key' => 'should-be-ignored',
            ],
        ])->assertOk();

        $this->assertDatabaseHas('settings', ['key' => 'site_name', 'value' => 'Test Coop Ltd']);
        $this->assertDatabaseHas('settings', ['key' => 'currency_code', 'value' => 'USD']);
        $this->assertDatabaseMissing('settings', ['key' => 'unknown_key']); // not whitelisted
    }

    public function test_general_settings_requires_permission(): void
    {
        Sanctum::actingAs($this->makeUser('plainuser@example.com', roleSlug: 'user'));
        $this->getJson('/api/general-settings')->assertStatus(403);
    }

    // ---- WS2: role-escalation guard ----

    public function test_non_superadmin_cannot_assign_superadmin_role(): void
    {
        // Actor can create users but is NOT a super-admin.
        $staffRole = Role::create(['name' => 'Staff X', 'slug' => 'staff-x']);
        $staffRole->permissions()->sync(
            Permission::whereIn('slug', ['user.create', 'user.view'])->pluck('id')
        );
        $actor = $this->makeUser('staff@example.com');
        $actor->roles()->attach($staffRole->id);

        Sanctum::actingAs($actor);

        $superAdminId = Role::where('slug', 'super-admin')->value('id');

        $this->postJson('/api/users', [
            'name' => 'Escalated',
            'email' => 'escalated@example.com',
            'password' => 'password123',
            'status' => true,
            'roles' => [$superAdminId],
        ])->assertStatus(403);

        $this->assertDatabaseMissing('users', ['email' => 'escalated@example.com']);
    }
}
