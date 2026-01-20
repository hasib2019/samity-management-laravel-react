<?php

namespace App\Helpers;

use App\Models\GlAccount;
use App\Models\Transaction;

class BalanceHelper
{
    /**
     * Get GL Account Balance
     *
     * @param int|string $glIdentifier ID or GL Code
     * @param int|null $samityId Optional Samity ID
     * @return float
     */
    public static function getBalance($glIdentifier, $samityId = null)
    {
        // Find GL Account
        $glAccount = null;
        if (is_numeric($glIdentifier)) {
            $glAccount = GlAccount::find($glIdentifier);
        }

        if (!$glAccount) {
            $glAccount = GlAccount::where('glac_code', $glIdentifier)->first();
        }

        if (!$glAccount) {
            return 0.0;
        }

        // Base Query
        $query = Transaction::where('glac_id', $glAccount->id)
            ->where('status', 'posted');

        if ($samityId) {
            $query->where('samity_id', $samityId);
        }

        // Calculate Sums
        $sums = $query->selectRaw('COALESCE(SUM(dr_amt), 0) as total_dr, COALESCE(SUM(cr_amt), 0) as total_cr')->first();

        $dr = (float) $sums->total_dr;
        $cr = (float) $sums->total_cr;

        // Apply Logic based on User Requirement:
        // glac_type=1 (Asset), 4 (Expense) AND gl_nature='D' => dr - cr
        if (in_array($glAccount->glac_type, [1, 4]) && strtoupper($glAccount->gl_nature) === 'D') {
            return $dr - $cr;
        }

        // glac_type 2 (Liability), 3 (Income) => cr - dr
        if (in_array($glAccount->glac_type, [2, 3])) {
            return $cr - $dr;
        }

        // Fallback for other cases (if any)
        // If Nature is Debit, return DR - CR
        if (strtoupper($glAccount->gl_nature) === 'D') {
            return $dr - $cr;
        }

        // Default: CR - DR
        return $cr - $dr;
    }
}
