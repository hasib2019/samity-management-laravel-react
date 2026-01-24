<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            self::logAudit('create', $model, null, $model->toArray());
        });

        static::updated(function ($model) {
            $oldValues = $model->getOriginal();
            $newValues = $model->getChanges();
            
            // Filter old values to only include changed fields
            $oldValuesFiltered = array_intersect_key($oldValues, $newValues);

            self::logAudit('update', $model, $oldValuesFiltered, $newValues);
        });

        static::deleted(function ($model) {
            self::logAudit('delete', $model, $model->toArray(), null);
        });
    }

    protected static function logAudit($action, $model, $oldValues = null, $newValues = null)
    {
        // Only log if there is an authenticated user or if we want to log system actions too (usually we want user actions)
        // But sometimes background jobs might change things. For now, let's keep Auth check but make it optional if needed.
        // The user complained "no data", so maybe they are testing via API/Postman where Auth might be different?
        // But LoanApplication submission usually requires auth.
        
        $userId = Auth::id(); // Null if not logged in

        AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
