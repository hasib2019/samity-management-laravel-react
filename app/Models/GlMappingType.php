<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GlMappingType extends Model
{
    protected $table = 'gl_mst_type';

    protected $fillable = [
        'name',
        'type_code',
        'description',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    protected $appends = ['status_bool'];

    public function getStatusBoolAttribute(): bool
    {
        return (bool) $this->status;
    }
}
