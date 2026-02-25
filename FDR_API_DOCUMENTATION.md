# FDR Management System - API Documentation

## Base URL
```
/api
```

## Authentication
All endpoints require Bearer token authentication via Sanctum:
```
Authorization: Bearer {token}
```

## Response Format
All responses are in JSON format.

### Success Response
```json
{
  "message": "Success message",
  "data": { /* resource data */ }
}
```

### Error Response
```json
{
  "message": "Error message",
  "error": "Detailed error information",
  "errors": { /* validation errors if applicable */ }
}
```

---

## FDR Applications

### List FDR Applications
Get all FDR applications with pagination.

**Endpoint:** `GET /fdr-applications`

**Permission:** `fdr.application.view` OR `fdr.list.view`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| member_id | integer | Filter by member ID |
| status | string | Filter by status (active, closed, matured) |
| search | string | Search by account number or member code |
| page | integer | Page number (default: 1) |

**Response:**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "member_id": 1,
      "product_id": 5,
      "account_no": "FDR-20260225-45678",
      "fdr_amount": "50000.00",
      "duration": 24,
      "interest_rate": "8.50",
      "interest_payment_type": "quarterly",
      "start_date": "2025-02-25",
      "maturity_date": "2027-02-25",
      "maturity_amount": "58500.00",
      "status": "active",
      "is_matured": false,
      "months_remaining": 24,
      "created_by": 1,
      "updated_by": null,
      "created_at": "2025-02-25T10:00:00Z",
      "updated_at": "2025-02-25T10:00:00Z",
      "member": { /* member details */ },
      "product": { /* product details */ },
      "nominees": [ /* array of nominees */ ],
      "closings": [ /* array of closings */ ],
      "collections": [ /* array of collections */ ]
    }
  ],
  "per_page": 20,
  "total": 5,
  "last_page": 1
}
```

---

### Create FDR Application
Create a new FDR application.

**Endpoint:** `POST /fdr-applications`

**Permission:** `fdr.application.create`

**Request Body:**
```json
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
      "image": "base64_string_or_form_file"
    }
  ]
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| member_id | required, exists:member_infos,id |
| product_id | required, exists:product_mst,id |
| fdr_amount | required, numeric, min:0 |
| duration | required, integer, min:1 |
| start_date | required, date |
| interest_rate | nullable, numeric, min:0 |
| interest_payment_type | required, in:monthly,quarterly,half_yearly,yearly,maturity |
| nominees.*.nominee_name | required_with:nominees, string |
| nominees.*.relation | required_with:nominees, string |
| nominees.*.percentage | required_with:nominees, numeric |

**Response (201 Created):**
```json
{
  "message": "FDR Application created successfully",
  "data": {
    "id": 1,
    "member_id": 1,
    "product_id": 5,
    "account_no": "FDR-20260225-45678",
    "fdr_amount": "50000.00",
    "duration": 24,
    "interest_rate": "8.50",
    "interest_payment_type": "quarterly",
    "start_date": "2025-02-25",
    "maturity_date": "2027-02-25",
    "maturity_amount": "58500.00",
    "status": "active",
    "created_by": 1,
    "created_at": "2025-02-25T10:00:00Z",
    "member": { /* ... */ },
    "product": { /* ... */ },
    "nominees": [ /* ... */ ],
    "collections": [ /* ... */ ]
  }
}
```

---

### Get FDR Application
Get details of a specific FDR application.

**Endpoint:** `GET /fdr-applications/{id}`

**Permission:** `fdr.application.view`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | FDR Application ID |

**Response (200 OK):**
```json
{
  "id": 1,
  "member_id": 1,
  "product_id": 5,
  "account_no": "FDR-20260225-45678",
  "fdr_amount": "50000.00",
  "duration": 24,
  "interest_rate": "8.50",
  "interest_payment_type": "quarterly",
  "start_date": "2025-02-25",
  "maturity_date": "2027-02-25",
  "maturity_amount": "58500.00",
  "status": "active",
  "is_matured": false,
  "months_remaining": 24,
  "total_interest_collected": "3187.50",
  "created_by": 1,
  "updated_by": null,
  "created_at": "2025-02-25T10:00:00Z",
  "updated_at": "2025-02-25T10:00:00Z",
  "member": { /* ... */ },
  "product": { /* ... */ },
  "nominees": [ /* ... */ ],
  "closings": [ /* ... */ ],
  "collections": [ /* ... */ ]
}
```

---

### Update FDR Application
Update an existing FDR application (only active ones).

**Endpoint:** `PUT /fdr-applications/{id}`

**Permission:** `fdr.application.edit`

**Request Body:**
```json
{
  "fdr_amount": 50000,
  "duration": 24,
  "start_date": "2025-02-25",
  "interest_rate": 8.5,
  "interest_payment_type": "quarterly",
  "nominees": [ /* ... */ ]
}
```

**Response (200 OK):**
```json
{
  "message": "FDR Application updated successfully",
  "data": { /* updated FDR data */ }
}
```

---

### Delete FDR Application
Delete an FDR application (only if no transactions exist).

**Endpoint:** `DELETE /fdr-applications/{id}`

**Permission:** `fdr.application.delete`

**Response (200 OK):**
```json
{
  "message": "FDR Application deleted successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Cannot delete FDR with existing transactions"
}
```

---

## FDR Collections

### List FDR Collections
Get all FDR interest collections.

**Endpoint:** `GET /fdr-collections`

**Permission:** `fdr.collection.view`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| fdr_application_id | integer | Filter by FDR application |
| status | string | Filter by status (pending, collected, cancelled) |
| collection_type | string | Filter by type (monthly, quarterly, half_yearly, yearly) |
| page | integer | Page number |

**Response:**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "fdr_application_id": 1,
      "collection_date": "2025-05-25",
      "interest_amount": "1062.50",
      "period_from": "2025-02-25",
      "period_to": "2025-05-25",
      "collection_type": "quarterly",
      "status": "collected",
      "remarks": null,
      "created_by": 1,
      "updated_by": null,
      "created_at": "2025-05-25T10:00:00Z",
      "updated_at": "2025-05-25T10:00:00Z",
      "fdrApplication": { /* ... */ }
    }
  ],
  "per_page": 20,
  "total": 3,
  "last_page": 1
}
```

---

### Search Pending Collections
Search for active FDRs with pending collections.

**Endpoint:** `GET /fdr-collections/search`

**Permission:** `fdr.collection.view`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Account number or member code |

**Response:**
```json
{
  "id": 1,
  "member_id": 1,
  "product_id": 5,
  "account_no": "FDR-20260225-45678",
  "fdr_amount": "50000.00",
  "status": "active",
  "member": { /* ... */ },
  "product": { /* ... */ },
  "collections": [
    {
      "id": 1,
      "collection_date": "2025-05-25",
      "interest_amount": "1062.50",
      "status": "pending",
      "period_from": "2025-02-25",
      "period_to": "2025-05-25"
    }
  ]
}
```

---

### Record Interest Collection
Record an FDR interest collection.

**Endpoint:** `POST /fdr-collections`

**Permission:** `fdr.collection.create`

**Request Body:**
```json
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

**Validation Rules:**
| Field | Rules |
|-------|-------|
| fdr_application_id | required, exists:fdr_applications,id |
| collection_date | required, date |
| interest_amount | required, numeric, min:0 |
| period_from | required, date |
| period_to | required, date |
| collection_type | required, in:monthly,quarterly,half_yearly,yearly |
| remarks | nullable, string |

**Response (201 Created):**
```json
{
  "message": "Interest collection recorded successfully",
  "data": {
    "id": 1,
    "fdr_application_id": 1,
    "collection_date": "2025-05-25",
    "interest_amount": "1062.50",
    "period_from": "2025-02-25",
    "period_to": "2025-05-25",
    "collection_type": "quarterly",
    "status": "collected",
    "remarks": "Quarterly interest collection",
    "created_by": 1,
    "created_at": "2025-05-25T10:00:00Z"
  }
}
```

**Note:** This endpoint creates GL transactions:
- Dr. Cash/Bank
- Cr. Interest Income

---

### Get Collection Details
Get details of a specific collection.

**Endpoint:** `GET /fdr-collections/{id}`

**Permission:** `fdr.collection.view`

**Response (200 OK):**
Similar to the collection object in list response.

---

### Update Collection
Update a collection record (only pending ones).

**Endpoint:** `PUT /fdr-collections/{id}`

**Permission:** `fdr.collection.edit`

**Request Body:**
```json
{
  "interest_amount": 1062.50,
  "collection_date": "2025-05-25",
  "remarks": "Updated remarks"
}
```

**Response (200 OK):**
```json
{
  "message": "Collection record updated successfully",
  "data": { /* updated collection */ }
}
```

---

### Cancel Collection
Delete/cancel a collection record.

**Endpoint:** `DELETE /fdr-collections/{id}`

**Permission:** `fdr.collection.delete`

**Response (200 OK):**
```json
{
  "message": "Collection record cancelled successfully"
}
```

**Note:** Only pending collections can be cancelled. The status is changed to 'cancelled' instead of being deleted.

---

### Generate Pending Collections
Auto-generate pending collection records for active FDRs.

**Endpoint:** `POST /fdr-collections/generate-pending`

**Permission:** `fdr.collection.create`

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "message": "Pending collections generated successfully",
  "generated": 5
}
```

**Description:** This endpoint:
1. Queries all active FDRs with periodic interest payment types
2. Checks if next collection is due
3. Calculates interest for the period
4. Creates pending collection records
5. Can be scheduled via Laravel Scheduler

---

## FDR Closings

### List FDR Closings
Get all FDR closings/redemptions.

**Endpoint:** `GET /fdr-closings`

**Permission:** `fdr.closing.view`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| fdr_application_id | integer | Filter by FDR application |
| status | string | Filter by status (pending, completed, cancelled) |
| page | integer | Page number |

**Response:**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "fdr_application_id": 1,
      "closing_date": "2027-02-25",
      "principal_amount": "50000.00",
      "total_interest_paid": "8500.00",
      "penalty_amount": "0.00",
      "total_paid": "58500.00",
      "status": "completed",
      "remarks": "Maturity closing",
      "created_by": 1,
      "updated_by": null,
      "created_at": "2027-02-25T10:00:00Z",
      "updated_at": "2027-02-25T10:00:00Z",
      "fdrApplication": { /* ... */ }
    }
  ],
  "per_page": 20,
  "total": 1,
  "last_page": 1
}
```

---

### Search for FDR to Close
Search active FDRs and get closing calculation.

**Endpoint:** `GET /fdr-closings/search`

**Permission:** `fdr.closing.view`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Account number or member code |

**Response:**
```json
{
  "application": {
    "id": 1,
    "account_no": "FDR-20260225-45678",
    "fdr_amount": "50000.00",
    "status": "active",
    "member": { /* ... */ },
    "product": { /* ... */ }
  },
  "closing_info": {
    "is_matured": false,
    "principal_amount": "50000.00",
    "total_interest_accrued": "4250.00",
    "interest_collected": "3187.50",
    "interest_due": "1062.50",
    "total_payable": "54250.00",
    "months_passed": 12,
    "maturity_date": "2027-02-25"
  }
}
```

---

### Record FDR Closing
Record an FDR closing/redemption.

**Endpoint:** `POST /fdr-closings`

**Permission:** `fdr.closing.create`

**Request Body:**
```json
{
  "fdr_application_id": 1,
  "closing_date": "2027-02-25",
  "principal_amount": 50000,
  "total_interest_paid": 8500,
  "penalty_amount": 0,
  "remarks": "Maturity closing"
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| fdr_application_id | required, exists:fdr_applications,id |
| closing_date | required, date |
| principal_amount | required, numeric, min:0 |
| total_interest_paid | required, numeric, min:0 |
| penalty_amount | nullable, numeric, min:0 |
| remarks | nullable, string |

**Response (201 Created):**
```json
{
  "message": "FDR Account closed successfully",
  "data": {
    "id": 1,
    "fdr_application_id": 1,
    "closing_date": "2027-02-25",
    "principal_amount": "50000.00",
    "total_interest_paid": "8500.00",
    "penalty_amount": "0.00",
    "total_paid": "58500.00",
    "status": "completed",
    "remarks": "Maturity closing",
    "created_by": 1,
    "created_at": "2027-02-25T10:00:00Z",
    "fdrApplication": { /* ... */ }
  }
}
```

**Side Effects:**
1. FDR status changed to 'closed'
2. GL transactions created for closing
3. All pending collections cancelled
4. GL transactions:
   - Dr. FDR Principal GL (Liability)
   - Dr. Interest Expense GL (if interest > 0)
   - Cr. Cash/Bank GL
   - Cr. Penalty Income GL (if penalty > 0)

---

### Get Closing Details
Get details of a specific closing.

**Endpoint:** `GET /fdr-closings/{id}`

**Permission:** `fdr.closing.view`

**Response (200 OK):**
Similar to closing object in list response.

---

### Update Closing
Update a closing record.

**Endpoint:** `PUT /fdr-closings/{id}`

**Permission:** `fdr.closing.edit`

**Request Body:**
```json
{
  "principal_amount": 50000,
  "total_interest_paid": 8500,
  "penalty_amount": 0,
  "remarks": "Updated remarks"
}
```

**Response (200 OK):**
```json
{
  "message": "Closing record updated successfully",
  "data": { /* updated closing */ }
}
```

**Note:** Only non-completed closings can be updated.

---

### Reverse Closing
Delete/reverse a closing record.

**Endpoint:** `DELETE /fdr-closings/{id}`

**Permission:** `fdr.closing.delete`

**Response (200 OK):**
```json
{
  "message": "Closing record deleted successfully"
}
```

**Side Effects:**
1. FDR status reverted to 'active'
2. GL transactions deleted
3. Closing record deleted

---

## Error Examples

### Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "fdr_amount": ["The fdr amount field is required."],
    "member_id": ["The selected member id is invalid."]
  }
}
```

### Not Found Error
```json
{
  "message": "FDR Application not found",
  "error": null
}
```

### Permission Denied
```json
{
  "message": "This action is unauthorized."
}
```

### Business Logic Error
```json
{
  "message": "Cannot delete FDR with existing transactions",
  "error": null
}
```

---

## Rate Limiting
No rate limiting is currently implemented. Please inform if needed.

## Pagination
List endpoints use cursor-based pagination:
- Default page size: 20 items
- Query parameter: `page` (starts from 1)

## Versioning
Current API version: v1 (implied in base URL `/api`)

---

## Field Descriptions

### FDR Application
| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique FDR ID |
| account_no | string | Auto-generated account number (FDR-YYYYMMDD-XXXXX) |
| member_id | integer | Associated member ID |
| product_id | integer | Associated product ID |
| fdr_amount | decimal | Principal amount |
| duration | integer | Duration in months |
| interest_rate | decimal | Annual interest rate (%) |
| interest_payment_type | enum | Payment frequency |
| start_date | date | Account opening date |
| maturity_date | date | Account maturity date |
| maturity_amount | decimal | Total payable at maturity |
| status | enum | active, closed, matured |

### FDR Collection
| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique collection ID |
| fdr_application_id | integer | Associated FDR ID |
| collection_date | date | Date of interest collection |
| interest_amount | decimal | Interest amount collected |
| period_from | date | Start of interest period |
| period_to | date | End of interest period |
| collection_type | enum | Type of collection |
| status | enum | pending, collected, cancelled |

### FDR Closing
| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique closing ID |
| fdr_application_id | integer | Associated FDR ID |
| closing_date | date | Date of closing |
| principal_amount | decimal | Principal paid |
| total_interest_paid | decimal | Total interest paid |
| penalty_amount | decimal | Penalty deducted |
| total_paid | decimal | Net amount paid |
| status | enum | pending, completed, cancelled |

---

## Code Examples

### Using cURL

```bash
# Create FDR Application
curl -X POST http://localhost/api/fdr-applications \
  -H "Authorization: Bearer YOUR_TOKEN" \
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

# Get FDR Details
curl -X GET http://localhost/api/fdr-applications/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Record Interest Collection
curl -X POST http://localhost/api/fdr-collections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fdr_application_id": 1,
    "collection_date": "2025-05-25",
    "interest_amount": 1062.50,
    "period_from": "2025-02-25",
    "period_to": "2025-05-25",
    "collection_type": "quarterly"
  }'

# Record FDR Closing
curl -X POST http://localhost/api/fdr-closings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fdr_application_id": 1,
    "closing_date": "2027-02-25",
    "principal_amount": 50000,
    "total_interest_paid": 8500,
    "penalty_amount": 0
  }'
```

### Using JavaScript/Fetch

```javascript
// Create FDR Application
fetch('/api/fdr-applications', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    member_id: 1,
    product_id: 5,
    fdr_amount: 50000,
    duration: 24,
    start_date: '2025-02-25',
    interest_rate: 8.5,
    interest_payment_type: 'quarterly'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

End of API Documentation
