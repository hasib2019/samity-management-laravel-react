<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\LoanRepaymentSchedule;
use Carbon\Carbon;

class UpdateOverdueSchedules extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'loan:update-overdue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update loan repayment schedules status to overdue if due date passed';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // 1. Identify Overdue Schedules
        // Only target schedules that are NOT paid and due date is past
        // And status is not yet 'overdue' (to avoid re-calculating fine every day if it's one-time fine)
        // OR if fine is daily, we need a different logic. 
        // Assuming one-time fine calculation when status flips to overdue.
        
        $schedules = LoanRepaymentSchedule::with(['loanApplication.product'])
            ->where('status', '!=', 'paid')
            ->where('status', '!=', 'overdue')
            ->whereDate('due_date', '<', Carbon::today())
            ->get();

        $count = 0;

        foreach ($schedules as $schedule) {
            $product = $schedule->loanApplication->product;
            
            // Default fine
            $fineAmount = 0;

            if ($product && $product->penalty_applicable) {
                $rate = $product->penalty_rate ?? 0;
                
                // Calculate Fine
                // Base Amount: Usually Overdue Principal or Installment Amount
                // Let's assume it's on the Installment Total Amount (Principal + Interest)
                $baseAmount = $schedule->total_amount; 
                
                if ($rate > 0) {
                    $fineAmount = ($baseAmount * $rate) / 100;
                }
            }

            // Update Schedule
            $schedule->status = 'overdue';
            // Only set fine amount if it's currently 0 or we want to overwrite?
            // Let's overwrite/set it.
            $schedule->fine_amount = $fineAmount;
            $schedule->save();
            
            $count++;
        }

        $this->info("Successfully updated {$count} schedules to overdue status with penalties.");
    }
}
