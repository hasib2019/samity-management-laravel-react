<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\Auditable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, Auditable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
        'language',
    ];

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function hasRole($role)
    {
        if (is_string($role)) {
            return $this->roles->contains('slug', $role);
        }
        return !!$role->intersect($this->roles)->count();
    }

    public function hasPermission($permission)
    {
        if ($this->hasRole('super-admin')) {
            return true;
        }

        $requestedPermission = $this->canonicalizePermissionSlug($permission);
        if (!$requestedPermission) {
            return false;
        }

        $this->loadMissing('roles.permissions');

        return $this->roles
            ->flatMap(function ($role) {
                return $role->permissions;
            })
            ->contains(function ($permissionModel) use ($requestedPermission) {
                return $this->canonicalizePermissionSlug($permissionModel->slug) === $requestedPermission;
            });
    }

    public function hasAnyPermission($permissions)
    {
        $permissionList = is_array($permissions) ? $permissions : [$permissions];

        foreach ($permissionList as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    public function getAuthorizedMenus()
    {
        $menus = Menu::with(['children.permissions', 'permissions'])
            ->whereNull('parent_id')
            ->orderBy('order')
            ->get();

        if ($this->hasRole('super-admin')) {
            // Super Admin sees everything except what they explicitly hide in the management interface
            return $menus;
        }

        return $menus->map(function ($menu) {
            return $this->filterMenu($menu);
        })->filter()->values();
    }

    protected function filterMenu($menu)
    {
        // If menu is hidden globally, it's not visible to regular users
        if ($menu->is_hidden) {
            return null;
        }

        // Filter children recursively
        if ($menu->children->count() > 0) {
            $menu->setRelation('children', $menu->children->map(function ($child) {
                return $this->filterMenu($child);
            })->filter()->values());
        }

        // Check if user has any permission for this menu
        $hasMenuPermission = $menu->permissions->some(function ($permission) {
            return $this->hasPermission($permission->slug);
        });

        // A menu is visible if it has a permission OR if it has visible children
        if ($hasMenuPermission || $menu->children->count() > 0) {
            return $menu;
        }

        return null;
    }

    protected function canonicalizePermissionSlug($permission): string
    {
        $slug = strtolower(trim((string) $permission));
        if ($slug === '') {
            return '';
        }

        $segments = preg_split('/[.\-_]+/', $slug, -1, PREG_SPLIT_NO_EMPTY);
        if (!$segments) {
            return '';
        }

        $action = array_pop($segments);
        $resource = implode('', $segments);

        return $resource . ':' . $action;
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
