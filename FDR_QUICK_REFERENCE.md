# FDR Management System - Quick Reference Guide

## Overview
Complete FDR (Fixed Deposit Receipt) management system for managing fixed deposit accounts with periodic interest collections and account closings.

## Quick Start

### 1. Run Migrations
```bash
php artisan migrate
```

### 2. Seed Permissions
```bash
php artisan db:seed --class=FdrPermissionSeeder
```

### 3. Configure Permissions
Assign FDR permissions to user roles through your admin panel:
- `fdr.application.*` - Application management
- `fdr.collection.*` - Interest collections
- `fdr.closing.*` - Account closings

## File Locations

| Component | Location |
|-----------|----------|
| Models | `app/Models/Fdr*.php` |
| Controllers | `app/Http/Controllers/Api/Fdr*.php` |
| Helper | `app/Helpers/FdrCalculationHelper.php` |
| Migrations | `database/migrations/` (FDR files) |
| Seeder | `database/seeders/FdrPermissionSeeder.php` |
| Routes | `routes/api.php` (FDR section) |
| Documentation | `FDR_*.md` files |

## Models & Relationships

```
FdrApplication (Main Model)
├── belongsTo → MemberInfo
├── belongsTo → Product
├── hasMany → FdrNominee
├── hasMany → FdrClosing
└── hasMany → FdrCollection

FdrNominee
└── belongsTo → FdrApplication

FdrClosing
└── belongsTo → FdrApplication

FdrCollection
└── belongsTo → FdrApplication
```

## API Endpoints Summary

### Create FDR
```
POST /api/fdr-applications
Body: {
  member_id, product_id, fdr_amount, duration, 
  start_date, interest_rate, interest_payment_type,
  nominees: [ { name, relation, percentage, dob, nid, image } ]
}
```

### Record Interest Collection
```
POST /api/fdr-collections
Body: {
  fdr_application_id, collection_date, interest_amount,
  period_from, period_to, collection_type, remarks
}
```

### Close FDR Account
```
POST /api/fdr-closings
Body: {
  fdr_application_id, closing_date, principal_amount,
  total_interest_paid, penalty_amount, remarks
}
```

### Search for Pending Collections
```
GET /api/fdr-collections/search?query=FDR-20260225-45678
```

### Search for FDR to Close
```
GET /api/fdr-closings/search?query=FDR-20260225-45678
```

### Generate Pending Collections
```
POST /api/fdr-collections/generate-pending
```

## Interest Calculation

**Formula:** Simple Interest
```
Interest = (Principal × Annual_Rate × Years) / 100
Maturity_Amount = Principal + Interest
```

**Helper Methods:**
```php
FdrCalculationHelper::calculateMaturityAmount($principal, $rate, $months)
FdrCalculationHelper::calculatePeriodicInterest($principal, $rate, $type)
FdrCalculationHelper::calculateAccruedInterest($principal, $rate, $start, $end)
FdrCalculationHelper::isMatured($maturityDate)
FdrCalculationHelper::monthsRemaining($maturityDate)
```

## Permissions

### Application Management
- `fdr.application.view` - List & view applications
- `fdr.application.create` - Create new FDR
- `fdr.application.edit` - Edit FDR details
- `fdr.application.delete` - Delete FDR

### Interest Collections
- `fdr.collection.view` - View collections
- `fdr.collection.create` - Record collections
- `fdr.collection.edit` - Edit collections
- `fdr.collection.delete` - Cancel collections

### Account Closings
- `fdr.closing.view` - View closings
- `fdr.closing.create` - Record closings
- `fdr.closing.edit` - Edit closings
- `fdr.closing.delete` - Reverse closings

## Database Tables

| Table | Purpose |
|-------|---------|
| fdr_applications | Main FDR accounts |
| fdr_nominees | Nominee information |
| fdr_collections | Interest collections |
| fdr_closings | Account closings |

## Key Fields

### fdr_applications
- `account_no` - Auto-generated (FDR-YYYYMMDD-XXXXX)
- `fdr_amount` - Principal
- `duration` - In months
- `interest_rate` - Annual %
- `interest_payment_type` - monthly/quarterly/half_yearly/yearly/maturity
- `status` - active/closed/matured

### fdr_collections
- `interest_amount` - Amount collected
- `collection_date` - When collected
- `period_from/to` - Interest period
- `status` - pending/collected/cancelled

### fdr_closings
- `principal_amount` - Principal paid
- `total_interest_paid` - Total interest
- `penalty_amount` - Penalty deducted
- `total_paid` - Net amount
- `status` - pending/completed/cancelled

## GL Accounting

### Interest Collection Transaction
```
Dr. Cash/Bank      → Interest amount
Cr. Interest Income → Interest amount
```

### FDR Closing Transaction
```
Dr. FDR Principal  → Principal amount
Dr. Interest GL    → Interest amount (if any)
Cr. Cash/Bank      → Total payment
Cr. Penalty Income → Penalty (if any)
```

## Common Workflows

### Creating an FDR
1. Gather member & product info
2. POST to `/api/fdr-applications` with details
3. System auto-generates account number
4. System creates first collection if periodic interest
5. FDR is set to "active" status

### Recording Interest Collection
1. GET `/api/fdr-collections/search?query=account_no` to get FDR
2. POST `/api/fdr-collections` with collection details
3. System creates GL transactions automatically
4. Collection marked as "collected"

### Closing FDR Account
1. GET `/api/fdr-closings/search?query=account_no` to calculate amounts
2. POST `/api/fdr-closings` with closing details
3. System updates FDR to "closed"
4. System creates GL transactions
5. Pending collections are cancelled

### Auto-generating Collections
1. POST `/api/fdr-collections/generate-pending` 
2. System checks all active FDRs
3. Creates pending collections for overdue dates
4. Can be scheduled via Laravel Scheduler

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful GET |
| 201 | Created - Successful POST |
| 400 | Bad Request - Validation/Logic error |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable - Validation errors |
| 500 | Server Error |

## Error Handling

All endpoints return errors in format:
```json
{
  "message": "Error message",
  "error": "Detailed error info",
  "errors": { "field": ["error message"] }
}
```

## Image Upload

Nominee images can be uploaded as:
1. **File** - Multipart form data
2. **Base64** - Data URL in JSON

Files stored at: `public/uploads/fdr_docs/nominee/`

## Performance Tips

1. Requests are paginated (20 items per page)
2. Use eager loading with relationships
3. Index key fields: account_no, member_id, status
4. Batch operations with generate-pending endpoint

## Testing Example

```bash
# Create FDR
curl -X POST http://localhost/api/fdr-applications \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": 1,
    "product_id": 5,
    "fdr_amount": 50000,
    "duration": 24,
    "start_date": "2025-02-25",
    "interest_rate": 8.5,
    "interest_payment_type": "quarterly"
  }'
```

## Troubleshooting

### GL Mapping Not Found
- Ensure GL mappings are configured for:
  - `gl_code_type: CASH_IN_HAND`
  - `gl_code_type: FDR_INTEREST_INCOME`
  - `gl_code_type: PENALTY`
- Check product GL IDs configuration

### Collection Not Creating
- Ensure FDR status is "active"
- Check interest_payment_type != "maturity"
- Verify collection date is before maturity date

### Cannot Close FDR
- Ensure FDR status is "active"
- Check all required fields (principal, interest, penalty)
- Verify GL accounts are available

## Related Documentation

- **Complete System Doc:** `FDR_MANAGEMENT_SYSTEM.md`
- **API Documentation:** `FDR_API_DOCUMENTATION.md`
- **Implementation Summary:** `FDR_IMPLEMENTATION_SUMMARY.md`
- **This Guide:** `FDR_QUICK_REFERENCE.md`

## Code Examples

### Using FdrCalculationHelper
```php
use App\Helpers\FdrCalculationHelper;
use Carbon\Carbon;

// Calculate maturity amount
$maturity = FdrCalculationHelper::calculateMaturityAmount(
  50000, // principal
  8.5,   // annual rate %
  24     // months
); // Returns: 58500

// Check if matured
$isMatured = FdrCalculationHelper::isMatured(
  Carbon::parse('2027-02-25')
);

// Get periodic interest
$monthlyInterest = FdrCalculationHelper::calculatePeriodicInterest(
  50000,      // principal
  8.5,        // rate
  'monthly'   // type
); // Returns: 354.17
```

### Query FDR with Relationships
```php
$fdr = FdrApplication::with([
  'member',
  'product',
  'nominees',
  'collections' => function($q) {
    $q->where('status', 'pending');
  },
  'closings'
])->find($id);
```

### Check FDR Status
```php
$fdr = FdrApplication::find($id);

if ($fdr->status === 'active') {
  $remaining = FdrCalculationHelper::monthsRemaining(
    Carbon::parse($fdr->maturity_date)
  );
  // Handle active FDR...
}
```

## Support

For detailed information on:
- **System Architecture** → See `FDR_MANAGEMENT_SYSTEM.md`
- **API Details** → See `FDR_API_DOCUMENTATION.md`
- **Implementation Details** → See `FDR_IMPLEMENTATION_SUMMARY.md`
- **Quick Commands** → This guide

---

**Last Updated:** February 25, 2025
**System Version:** 1.0
**Status:** Production Ready
