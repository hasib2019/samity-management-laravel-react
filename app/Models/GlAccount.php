<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GlAccount extends Model
{
    protected $table = 'glac_mst';

    protected $fillable = [
        'id',
        'glac_code',
        'glac_name',
        'parent_child',
        'parent_id',
        'glac_type',
        'level_code',
        'gl_nature',
        'allow_manual_dr',
        'allow_manual_cr',
        'status',
        'auth_by',
        'auth_date',
        'created_by',
        'updated_by',
        'is_default',
        'doptor_id',
        'is_abonton',
        'is_percentage',
        'is_carry_forward',
        'is_income_expense'
    ];

    protected $casts = [
        'auth_date' => 'date',
        'is_default' => 'boolean',
        'is_abonton' => 'boolean',
        'is_carry_forward' => 'boolean',
        'is_income_expense' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(GlAccount::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(GlAccount::class, 'parent_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
