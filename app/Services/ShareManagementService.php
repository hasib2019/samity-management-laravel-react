<?php

namespace App\Services;

use App\Models\MemberInfo;
use App\Models\Product;
use App\Models\SamityProfile;
use App\Models\ShareAccount;
use App\Models\ShareTransaction;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ShareManagementService
{
    public function getActiveShareProduct(): Product
    {
        $product = Product::where('product_type', 'share')
            ->where('status', 'active')
            ->orderBy('id')
            ->first();

        if (!$product) {
            throw new \Exception('No active share product found. Please configure a share product first.');
        }

        return $product;
    }

    public function getMemberCurrentShares(int $memberId): int
    {
        return (int) round(ShareAccount::where('member_id', $memberId)->sum('total_shares'));
    }

    public function getSamityAllocatedShares(int $samityId): int
    {
        return (int) round(
            ShareAccount::query()
                ->join('member_infos', 'member_infos.id', '=', 'share_accounts.member_id')
                ->where('member_infos.samity_id', $samityId)
                ->sum('share_accounts.total_shares')
        );
    }

    public function validatePurchase(MemberInfo $member, int|float $purchaseQuantity): void
    {
        $purchaseQuantity = (int) $purchaseQuantity;

        if ($purchaseQuantity <= 0) {
            return;
        }

        $samity = SamityProfile::find($member->samity_id);
        if (!$samity) {
            throw new \Exception('Selected samity was not found.');
        }

        $soldShare = (int) ($samity->sold_share ?? 0);
        $sharePrice = (float) ($samity->share_price ?? 0);

        if ($soldShare <= 0) {
            throw new \Exception('Sold share is not configured for the selected samity.');
        }

        if ($sharePrice <= 0) {
            throw new \Exception('Share price is not configured for the selected samity.');
        }

        $currentMemberShares = $this->getMemberCurrentShares($member->id);
        $currentSamityAllocatedShares = $this->getSamityAllocatedShares($member->samity_id);
        $maxPerMember = (int) floor($soldShare * 0.20);

        if ($currentSamityAllocatedShares + $purchaseQuantity > $soldShare) {
            $remaining = max($soldShare - $currentSamityAllocatedShares, 0);
            throw new \Exception("Requested shares exceed samity sold share limit. Remaining available: {$remaining}.");
        }

        if (($currentMemberShares + $purchaseQuantity) > $maxPerMember) {
            throw new \Exception("A member cannot hold more than {$maxPerMember} shares for this samity.");
        }
    }

    public function recordPurchase(
        MemberInfo $member,
        int $productId,
        string $tranDate,
        int|float $quantity,
        ?string $remarks = null,
        ?float $faceValue = null
    ): ShareAccount {
        $quantity = (int) $quantity;
        if ($quantity <= 0) {
            throw new \Exception('Purchase quantity must be greater than zero.');
        }

        $product = Product::findOrFail($productId);
        $samity = SamityProfile::find($member->samity_id);

        if (!$samity) {
            throw new \Exception('Selected samity was not found.');
        }

        $resolvedFaceValue = $faceValue ?? (float) ($samity->share_price ?? 0);
        if ($resolvedFaceValue <= 0) {
            throw new \Exception('Share price is not configured for the selected samity.');
        }

        $this->validatePurchase($member, $quantity);

        $totalAmount = $quantity * $resolvedFaceValue;

        $shareAccount = ShareAccount::firstOrCreate(
            ['member_id' => $member->id, 'product_id' => $productId],
            [
                'account_no' => 'SH-' . date('Ymd') . '-' . rand(1000, 9999),
                'face_value' => $resolvedFaceValue,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]
        );

        if (!$shareAccount->face_value || (float) $shareAccount->face_value <= 0) {
            $shareAccount->face_value = $resolvedFaceValue;
        }

        $shareAccount->updated_by = Auth::id();
        $shareAccount->save();

        ShareTransaction::create([
            'share_account_id' => $shareAccount->id,
            'tran_date' => $tranDate,
            'tran_type' => 'purchase',
            'quantity' => $quantity,
            'face_value' => $resolvedFaceValue,
            'amount' => $totalAmount,
            'remarks' => $remarks,
            'created_by' => Auth::id(),
        ]);

        $shareAccount->increment('total_shares', $quantity);
        $shareAccount->increment('current_balance', $totalAmount);

        $batch = 'SHP' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

        $commonData = [
            'samity_id' => $member->samity_id,
            'customer_id' => $member->id,
            'product_id' => $productId,
            'payment_mode' => 'cash',
            'batch_num' => $batch,
            'tran_code' => 'PUR',
            'tran_date' => $tranDate,
            'tran_type' => 'SHARE_PURCHASE',
            'naration' => $remarks ?: "Share Purchase for {$shareAccount->account_no}",
            'status' => 'posted',
            'authorize_status' => 'approved',
            'authorized_by' => Auth::id(),
            'authorized_at' => now(),
            'created_by' => Auth::id(),
        ];

        $cashGlId = $product->shr_cash_bank_dr_gl_id;
        if (!$cashGlId) {
            throw new \Exception('Cash/Bank GL is not mapped for share product');
        }

        Transaction::create(array_merge($commonData, [
            'tran_num' => date('YmdHis') . rand(10, 99),
            'glac_id' => $cashGlId,
            'dr_amt' => $totalAmount,
            'cr_amt' => 0,
        ]));

        $shareGlId = $product->shr_capital_cr_gl_id;
        if (!$shareGlId) {
            throw new \Exception('Share Capital GL not mapped for product');
        }

        Transaction::create(array_merge($commonData, [
            'tran_num' => date('YmdHis') . rand(10, 99),
            'glac_id' => $shareGlId,
            'dr_amt' => 0,
            'cr_amt' => $totalAmount,
        ]));

        $this->syncMemberShareSnapshot($member->id);

        return $shareAccount->fresh();
    }

    public function syncMemberShareSnapshot(int $memberId): void
    {
        $member = MemberInfo::with('samity')->find($memberId);
        if (!$member) {
            return;
        }

        $shareCount = $this->getMemberCurrentShares($memberId);

        $member->update([
            'no_of_share' => $shareCount,
            'share_price' => (float) ($member->samity->share_price ?? 0),
            'updated_by' => Auth::id() ?? $member->updated_by,
        ]);
    }
}
