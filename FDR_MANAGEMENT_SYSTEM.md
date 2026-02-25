# FDR Management System - Complete Documentation

## Overview
This is a comprehensive Fixed Deposit Receipt (FDR) management system built with Laravel. It provides complete functionality for managing FDR applications, periodic interest collections, and account closings with full GL accounting integration.

## Components

### 1. Models

#### FdrApplication
Main model for FDR accounts with the following features:
- Track principal amount, interest rate, and duration
- Support multiple interest payment types (monthly, quarterly, half-yearly, yearly, maturity)
- Calculate and store maturity dates and amounts
- Support for multiple nominees
- Track account status (active, closed, matured)

**Key Fields:**
- `account_no` - Auto-generated unique account number
- `fdr_amount` - Principal amount
- `duration` - Duration in months
- `interest_rate` - Annual interest rate (%)
- `interest_payment_type` - Frequency of interest payment
- `start_date` & `maturity_date` - Account tenure
- `maturity_amount` - Total payable at maturity
- `status` - active | closed | matured

**Relationships:**
- `member()` - Belongs to MemberInfo
- `product()` - Belongs to Product
- `nominees()` - Has many FdrNominee
- `closings()` - Has many FdrClosing
- `collections()` - Has many FdrCollection

#### FdrNominee
Model to store nominee information for each FDR account.

**Key Fields:**
- `nominee_name` - Name of the nominee
- `relation` - Relationship to member
- `dob` - Date of birth
- `nid` - NID/ID number
- `percentage` - Percentage allocation (can sum to >100 if multiple nominees)
- `image` - Nominee photo/document

#### FdrClosing
Model to record FDR closings/redemptions.

**Key Fields:**
- `closing_date` - Date of closing
- `principal_amount` - Principal paid
- `total_interest_paid` - Total interest paid
- `penalty_amount` - Any penalties applied
- `total_paid` - Net amount paid
- `status` - pending | completed | cancelled

#### FdrCollection
Model to track periodic interest collections.

**Key Fields:**
- `collection_date` - Date of interest collection
- `interest_amount` - Amount collected
- `period_from` & `period_to` - Interest accrual period
- `collection_type` - Type of collection (monthly, quarterly, etc.)
- `status` - pending | collected | cancelled

### 2. Controllers

#### FdrApplicationController
Handles CRUD operations for FDR applications.

**Endpoints:**
```
GET    /api/fdr-applications              - List all FDRs
POST   /api/fdr-applications              - Create new FDR
GET    /api/fdr-applications/{id}         - Get FDR details
PUT    /api/fdr-applications/{id}         - Update FDR
DELETE /api/fdr-applications/{id}         - Delete FDR
```

**Features:**
- Auto-generate account numbers
- Calculate maturity amounts using interest formulas
- Handle nominee image uploads (file or base64)
- Auto-create first collection if periodic interest payment
- Include nominees and collections in responses
- Search by member ID, account number, or member code
- Calculate and include maturity status

#### FdrCollectionController
Manages periodic interest collections.

**Endpoints:**
```
GET    /api/fdr-collections               - List all collections
POST   /api/fdr-collections               - Record interest collection
GET    /api/fdr-collections/{id}          - Get collection details
PUT    /api/fdr-collections/{id}          - Update collection
DELETE /api/fdr-collections/{id}          - Cancel collection
GET    /api/fdr-collections/search        - Search pending collections
POST   /api/fdr-collections/generate-pending - Generate pending collections
```

**Features:**
- Record interest payments for periodic FDRs
- Create GL transactions for interest collection
- Generate pending collections automatically
- Track collection status and periods
- Calculate interest based on payment frequency

#### FdrClosingController
Manages FDR account closings.

**Endpoints:**
```
GET    /api/fdr-closings                  - List all closings
POST   /api/fdr-closings                  - Record FDR closing
GET    /api/fdr-closings/{id}             - Get closing details
PUT    /api/fdr-closings/{id}             - Update closing
DELETE /api/fdr-closings/{id}             - Reverse closing
GET    /api/fdr-closings/search           - Search active FDRs for closing
```

**Features:**
- Search and calculate closing amounts
- Support both matured and premature closings
- Calculate total accrued interest
- Handle penalties for early closure
- Create GL transactions for closing
- Update FDR status to closed
- Cancel pending collections on closing

### 3. Helper Class

#### FdrCalculationHelper
Utility class for FDR calculations.

**Key Methods:**
```php
// Calculate maturity amount
FdrCalculationHelper::calculateMaturityAmount($principal, $rate, $months)

// Calculate total interest
FdrCalculationHelper::calculateTotalInterest($principal, $rate, $months)

// Calculate periodic interest payment
FdrCalculationHelper::calculatePeriodicInterest($principal, $rate, $type)

// Calculate accrued interest up to a date
FdrCalculationHelper::calculateAccruedInterest($principal, $rate, $startDate, $endDate)

// Check if matured
FdrCalculationHelper::isMatured($maturityDate)

// Get remaining months
FdrCalculationHelper::monthsRemaining($maturityDate)

// Get next collection date
FdrCalculationHelper::getNextCollectionDate($lastDate, $type)

// Calculate premature closure penalty
FdrCalculationHelper::calculatePrematurePenalty($principal, $interest, $penaltyPercentage)
```

### 4. Migrations

#### Create FDR Tables (2026_02_02_190150)
- `fdr_applications` table
- `fdr_nominees` table

#### Create FDR Closings Table (2026_02_25_000001)
- `fdr_closings` table for tracking account closings

#### Create FDR Collections Table (2026_02_25_000002)
- `fdr_collections` table for tracking interest collections

### 5. Routes

All FDR routes are protected by permission middleware. Routes are defined in `routes/api.php` within the authenticated middleware group.

```php
// FDR Management
Route::apiResource('fdr-applications', FdrApplicationController::class);

// FDR Collections (CRUD + search + generate)
Route::get('fdr-collections/search', 'search');
Route::post('fdr-collections', 'store');
Route::get('fdr-collections', 'index');
Route::get('fdr-collections/{id}', 'show');
Route::put('fdr-collections/{id}', 'update');
Route::delete('fdr-collections/{id}', 'destroy');
Route::post('fdr-collections/generate-pending', 'generatePendingCollections');

// FDR Closing (CRUD + search)
Route::get('fdr-closings/search', 'search');
Route::get('fdr-closings', 'index');
Route::post('fdr-closings', 'store');
Route::get('fdr-closings/{id}', 'show');
Route::put('fdr-closings/{id}', 'update');
Route::delete('fdr-closings/{id}', 'destroy');
```

## Permission System

The following permissions should be configured in the system:

### FDR Application Permissions
- `fdr.application.view` - View FDR applications
- `fdr.application.create` - Create new FDR
- `fdr.application.edit` - Edit FDR details
- `fdr.application.delete` - Delete FDR
- `fdr.list.view` - Alternative view permission

### FDR Collection Permissions
- `fdr.collection.view` - View collections
- `fdr.collection.create` - Record interest collection
- `fdr.collection.edit` - Edit collection records
- `fdr.collection.delete` - Delete/cancel collections

### FDR Closing Permissions
- `fdr.closing.view` - View closings
- `fdr.closing.create` - Record FDR closing
- `fdr.closing.edit` - Edit closing records
- `fdr.closing.delete` - Reverse/delete closings

## GL Accounting Integration

The system creates GL transactions for all FDR-related operations:

### FDR Collection Transaction
```
Dr. Cash/Bank              (Asset)
Cr. Interest Income        (Income)
```

### FDR Closing Transaction
```
Dr. FDR Principal GL       (Liability)
Dr. Interest Expense GL    (Expense)
Cr. Cash/Bank              (Asset)
Cr. Penalty Income GL      (Income - if applicable)
```

GL accounts are mapped through:
- Product GL IDs: `gl_principal_id`, `gl_profit_id`, `gl_penalty_id`
- Global Mappings: `gl_code_type` (CASH_IN_HAND, FDR_INTEREST_INCOME, PENALTY)

## API Request/Response Examples

### Create FDR Application
```json
POST /api/fdr-applications
{
  "member_id": 1,
  "product_id": 5,
  "fdr_amount": 50000,
  "duration": 24,
  "start_date": "2025-02-25",
  "interest_rate": 8.5,
  "interest_payment_type": "quarterly",
  "nominees": [
    {
      "nominee_name": "John Doe",
      "relation": "Son",
      "dob": "1990-05-15",
      "nid": "1234567890",
      "percentage": 100,
      "image": "base64_encoded_image_or_file"
    }
  ]
}
```

### Record Interest Collection
```json
POST /api/fdr-collections
{
  "fdr_application_id": 1,
  "collection_date": "2025-05-25",
  "interest_amount": 1062.50,
  "period_from": "2025-02-25",
  "period_to": "2025-05-25",
  "collection_type": "quarterly",
  "remarks": "Quarterly interest collection"
}
```

### Record FDR Closing
```json
POST /api/fdr-closings
{
  "fdr_application_id": 1,
  "closing_date": "2026-02-25",
  "principal_amount": 50000,
  "total_interest_paid": 8500,
  "penalty_amount": 0,
  "remarks": "Maturity closing"
}
```

## Interest Calculation Formula

The system uses **Simple Interest** formula:

```
Interest = (Principal × Rate × Time) / 100
Maturity Amount = Principal + Interest
```

Where:
- Principal = FDR Amount
- Rate = Annual Interest Rate (%)
- Time = Duration in years (months / 12)

### Periodic Interest Calculation
For periodic interest payments:
```
Monthly Interest = (Principal × Annual_Rate / 12) / 100
Quarterly Interest = (Principal × Annual_Rate / 4) / 100
Half-Yearly Interest = (Principal × Annual_Rate / 2) / 100
Yearly Interest = (Principal × Annual_Rate) / 100
```

## Workflow

### Creating an FDR
1. User creates FDR application with principal amount and duration
2. System auto-generates account number
3. System calculates maturity date and amount
4. System creates nominee records if provided
5. If periodic interest payment: system creates first collection record
6. Application is set to "active" status

### Recording Interest Collection
1. User searches for active FDR by account number or member code
2. System displays pending collections
3. User records interest payment
4. System creates GL transactions:
   - Dr. Cash/Bank
   - Cr. Interest Income
5. Collection is marked as "collected"

### Closing FDR Account
1. User searches for active FDR
2. System calculates and displays:
   - Principal amount
   - Total interest accrued
   - Interest already collected
   - Interest due
   - Maturity status
3. User confirms closing with amounts
4. System updates FDR status to "closed"
5. System creates GL transactions for closing
6. Pending collections are cancelled
7. Closing record is created

### Generating Pending Collections
1. System queries all active FDRs with periodic interest payment
2. For each FDR, checks if next collection is due
3. Calculates interest for the period
4. Creates pending collection records
5. Can be run via API endpoint or scheduled job

## Database Schema

### fdr_applications
```sql
CREATE TABLE fdr_applications (
    id BIGINT PRIMARY KEY,
    member_id BIGINT NOT NULL (FK: member_infos.id),
    product_id BIGINT NOT NULL (FK: product_mst.id),
    account_no VARCHAR UNIQUE,
    fdr_amount DECIMAL(15,2),
    duration INT,
    interest_rate DECIMAL(5,2),
    interest_payment_type ENUM('monthly', 'quarterly', 'half_yearly', 'yearly', 'maturity'),
    start_date DATE,
    maturity_date DATE,
    maturity_amount DECIMAL(15,2),
    status ENUM('active', 'closed', 'matured'),
    created_by BIGINT,
    updated_by BIGINT,
    timestamps
);
```

### fdr_nominees
```sql
CREATE TABLE fdr_nominees (
    id BIGINT PRIMARY KEY,
    fdr_application_id BIGINT NOT NULL (FK),
    nominee_name VARCHAR,
    relation VARCHAR,
    dob DATE,
    nid VARCHAR,
    percentage DECIMAL(5,2),
    image VARCHAR,
    timestamps
);
```

### fdr_closings
```sql
CREATE TABLE fdr_closings (
    id BIGINT PRIMARY KEY,
    fdr_application_id BIGINT NOT NULL (FK),
    closing_date DATE,
    principal_amount DECIMAL(15,2),
    total_interest_paid DECIMAL(15,2),
    penalty_amount DECIMAL(15,2),
    total_paid DECIMAL(15,2),
    status ENUM('pending', 'completed', 'cancelled'),
    remarks TEXT,
    created_by BIGINT,
    updated_by BIGINT,
    timestamps
);
```

### fdr_collections
```sql
CREATE TABLE fdr_collections (
    id BIGINT PRIMARY KEY,
    fdr_application_id BIGINT NOT NULL (FK),
    collection_date DATE,
    interest_amount DECIMAL(15,2),
    period_from DATE,
    period_to DATE,
    collection_type ENUM('monthly', 'quarterly', 'half_yearly', 'yearly'),
    status ENUM('pending', 'collected', 'cancelled'),
    remarks TEXT,
    created_by BIGINT,
    updated_by BIGINT,
    timestamps
);
```

## Directory Structure

```
app/
  ├── Models/
  │   ├── FdrApplication.php
  │   ├── FdrNominee.php
  │   ├── FdrClosing.php
  │   └── FdrCollection.php
  ├── Http/Controllers/Api/
  │   ├── FdrApplicationController.php
  │   ├── FdrCollectionController.php
  │   └── FdrClosingController.php
  └── Helpers/
      └── FdrCalculationHelper.php
database/
  └── migrations/
      ├── 2026_02_02_190150_create_fdr_tables.php
      ├── 2026_02_25_000001_create_fdr_closings_table.php
      └── 2026_02_25_000002_create_fdr_collections_table.php
routes/
  └── api.php (FDR routes section)
public/uploads/fdr_docs/nominee/  (Nominee images directory)
```

## File Uploads

Nominee images can be uploaded in two ways:

1. **File Upload**: Via multipart form data with key `nominees[n][image]`
2. **Base64 String**: As base64 encoded data URL in JSON request

Files are stored at: `public/uploads/fdr_docs/nominee/`

## Error Handling

All endpoints return proper HTTP status codes:
- `200 OK` - Successful GET request
- `201 Created` - Successful POST request
- `400 Bad Request` - Validation error or business logic error
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation failures
- `500 Internal Server Error` - Server error

All error responses include error details.

## Performance Considerations

1. **Eager Loading**: Controllers use eager loading for related models
2. **Pagination**: List endpoints are paginated (20 items per page)
3. **Indexes**: Recommend indexing on: account_no, member_id, status, collection_date
4. **GL Transactions**: Wrapped in database transactions for data consistency

## Future Enhancements

1. **Scheduled Jobs**: Auto-generate collections via Laravel scheduler
2. **Penalty Calculation**: Advanced penalty rules for early closure
3. **Compound Interest**: Support for compound interest calculation
4. **Maturity Notifications**: Notify customers near maturity date
5. **Bulk Operations**: Bulk FDR creation and collection processing
6. **Reports**: FDR portfolio analysis and reports
7. **Audit Trail**: Enhanced audit logging for all operations

## Testing

Recommend testing:
- CRUD operations for each entity
- Interest calculation accuracy
- GL transaction creation
- Permission-based access control
- Image upload handling
- Edge cases (maturity boundaries, zero amounts, etc.)
- Data consistency in transactions

## Support

For issues or questions regarding the FDR Management System, please refer to the code comments and inline documentation in controller methods.
