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
        return GlAccount::whereNull('parent_id')
            ->with('children')
            ->get();
    }
}
