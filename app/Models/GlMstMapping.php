<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GlMstMapping extends Model
{
    protected $table = 'gl_mst_mapping';

    protected $fillable = [
        'gl_code_type',
        'gl_mst_id',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function glAccount(): BelongsTo
    {
        return $this->belongsTo(GlAccount::class, 'gl_mst_id');
    }

    public function mappingType(): BelongsTo
    {
        return $this->belongsTo(GlMappingType::class, 'gl_code_type', 'type_code');
    }
}

