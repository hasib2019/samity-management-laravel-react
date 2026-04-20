<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class ProjectInvestmentPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissionMap = [
            'project-declarations' => ['project.declaration.view', 'project.declaration.create', 'project.declaration.edit', 'project.declaration.delete'],
            'project-share-sales' => ['project.share.sale.view', 'project.share.sale.create'],
            'project-closings' => ['project.closing.view', 'project.closing.create'],
            'project-investors' => ['project.investor.view'],
        ];

        foreach ($permissionMap as $menuSlug => $permissions) {
            $menu = Menu::where('slug', $menuSlug)->first();
            if (!$menu) {
                continue;
            }

            foreach ($permissions as $slug) {
                Permission::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => ucwords(str_replace('.', ' ', $slug)),
                        'menu_id' => $menu->id,
                    ]
                );
            }
        }
    }
}
