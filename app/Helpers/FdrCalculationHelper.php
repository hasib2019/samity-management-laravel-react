<?php

namespace App\Helpers;

use Carbon\Carbon;

class FdrCalculationHelper
{
    /**
     * Calculate maturity amount based on principal, rate, and duration
     * 
     * @param float $principal
     * @param float $interestRate (annual percentage)
     * @param int $months (duration in months)
     * @return float
     */
    public static function calculateMaturityAmount($principal, $interestRate, $months)
    {
        // Simple Interest: A = P + (P * R * T / 100)
        // where T is in years
        $years = $months / 12;
        $interest = ($principal * $interestRate * $years) / 100;
        return $principal + $interest;
    }

    /**
     * Calculate total interest for a period
     * 
     * @param float $principal
     * @param float $interestRate (annual percentage)
     * @param int $months
     * @return float
     */
    public static function calculateTotalInterest($principal, $interestRate, $months)
    {
        $years = $months / 12;
        return ($principal * $interestRate * $years) / 100;
    }

    /**
     * Calculate periodic interest payment
     * 
     * @param float $principal
     * @param float $interestRate (annual percentage)
     * @param string $paymentType (monthly, quarterly, half_yearly, yearly)
     * @return float
     */
    public static function calculatePeriodicInterest($principal, $interestRate, $paymentType)
    {
        $monthlyRate = $interestRate / 12;
        
        switch ($paymentType) {
            case 'monthly':
                return ($principal * $monthlyRate) / 100;
            case 'quarterly':
                return ($principal * ($monthlyRate * 3)) / 100;
            case 'half_yearly':
                return ($principal * ($monthlyRate * 6)) / 100;
            case 'yearly':
                return ($principal * $interestRate) / 100;
            default:
                return 0;
        }
    }

    /**
     * Calculate interest accrued from start date to a given date
     * 
     * @param float $principal
     * @param float $interestRate (annual percentage)
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return float
     */
    public static function calculateAccruedInterest($principal, $interestRate, $startDate, $endDate)
    {
        $monthsDifference = $startDate->diffInMonths($endDate);
        return self::calculateTotalInterest($principal, $interestRate, $monthsDifference);
    }

    /**
     * Determine if FDR is matured
     * 
     * @param Carbon $maturityDate
     * @return bool
     */
    public static function isMatured($maturityDate)
    {
        return Carbon::now()->gte($maturityDate);
    }

    /**
     * Calculate months remaining until maturity
     * 
     * @param Carbon $maturityDate
     * @return int
     */
    public static function monthsRemaining($maturityDate)
    {
        return Carbon::now()->diffInMonths($maturityDate, false);
    }

    /**
     * Generate next collection date
     * 
     * @param Carbon $lastCollectionDate
     * @param string $paymentType (monthly, quarterly, half_yearly, yearly)
     * @return Carbon
     */
    public static function getNextCollectionDate($lastCollectionDate, $paymentType)
    {
        switch ($paymentType) {
            case 'monthly':
                return $lastCollectionDate->copy()->addMonths(1);
            case 'quarterly':
                return $lastCollectionDate->copy()->addMonths(3);
            case 'half_yearly':
                return $lastCollectionDate->copy()->addMonths(6);
            case 'yearly':
                return $lastCollectionDate->copy()->addYears(1);
            default:
                return $lastCollectionDate;
        }
    }

    /**
     * Calculate penalty for premature closing
     * 
     * @param float $principal
     * @param float $accruedInterest
     * @param float $penaltyPercentage (percentage of principal)
     * @return float
     */
    public static function calculatePrematurePenalty($principal, $accruedInterest, $penaltyPercentage = 0)
    {
        if ($penaltyPercentage <= 0) {
            return 0;
        }
        return ($principal * $penaltyPercentage) / 100;
    }
}
