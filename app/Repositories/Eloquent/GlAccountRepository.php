<?php

namespace App\Repositories\Eloquent;

use App\Models\GlAccount;
use App\Repositories\Contracts\GlAccountRepositoryInterface;
use Illuminate\Support\Facades\DB;

class GlAccountRepository implements GlAccountRepositoryInterface
{
    public function all()
    {
        return GlAccount::all();
    }

    public function get(array $filters = [])
    {
        $query = GlAccount::query();

        if (isset($filters['parent_child'])) {
            $query->where('parent_child', $filters['parent_child']);
        }

        return $query->get();
    }

    public function find($id)
    {
        return GlAccount::find($id);
    }

    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            return GlAccount::create($data);
        });
    }

    public function update($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $account = GlAccount::findOrFail($id);
            $account->update($data);
            return $account;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $account = GlAccount::findOrFail($id);
            return $account->delete();
        });
    }

    public function getTree()
    {
        $allAccounts = GlAccount::orderBy('glac_code')->get();

        $accountsByParent = $allAccounts->groupBy('parent_id');

        // Roots are those with null parent_id or 0
        $roots = $accountsByParent->get(null) ?? collect();
        if ($accountsByParent->has(0)) {
            $roots = $roots->merge($accountsByParent->get(0));
        }

        foreach ($roots as $root) {
            $this->buildTree($root, $accountsByParent);
        }

        return $roots->values();
    }

    private function buildTree($node, $accountsByParent)
    {
        $children = $accountsByParent->get($node->id) ?? collect();

        foreach ($children as $child) {
            $this->buildTree($child, $accountsByParent);
        }

        $node->setRelation('children', $children);
    }
}
