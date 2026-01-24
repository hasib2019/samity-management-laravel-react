<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\Auditable;

class Menu extends Model
{
    use HasFactory, Auditable;

    protected $fillable = ['name', 'slug', 'icon', 'parent_id', 'order', 'is_hidden'];

    protected $casts = [
        'is_hidden' => 'boolean',
    ];

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(Permission::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Menu::class, 'parent_id')->orderBy('order');
    }
}
