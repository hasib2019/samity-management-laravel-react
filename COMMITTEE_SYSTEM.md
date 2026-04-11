# Committee Management System - API Documentation

## Overview
The Committee Management System provides a complete solution for managing different types of committees within a Samity (Group). It includes committee type configuration, member selection, document management, and approval workflow.

## Features
- **4 Committee Types**: Different types of committees with configurable validity periods
- **Dynamic Member Selection**: Support for 3, 6, 9, or 12 member committees with designations
- **Multiple Document Upload**: Attach required documents with file validation
- **Status Workflow**: Draft → Submitted → Approved/Rejected
- **Auto-calculated End Date**: Based on effective date + validity period from committee type
- **Permission-based Access**: Role-based access control for all operations

## Committee Types
1. **First Committee Addition - Approved** (অনুমোদিত প্রথম কমিটি সংযোজন)
   - Validity: 3 years
   - For committees already approved by higher authority

2. **Interim Committee Addition Request** (অন্তর্বর্তী কমিটি সংযোজনের আবেদন)
   - Validity: 1 year
   - For temporary committees

3. **Selected Committee Addition** (নির্বাচিত কমিটি সংযোজন)
   - Validity: 3 years
   - For committees with elected members

4. **Election Committee Appointment Request** (নির্বাচন কমিটি নিয়োগের আবেদন)
   - Validity: 2 years
   - For election-related committees

## Database Tables

### committee_types
```
- id: Primary Key
- name: Committee type name (English)
- name_bn: Committee type name (Bengali)
- description: Detailed description
- validity_period: Duration in years
- member_count_options: JSON array [3, 6, 9, 12]
- is_active: Boolean flag
- timestamps
```

### committees
```
- id: Primary Key
- samity_id: Foreign Key to samity_profiles
- committee_type_id: Foreign Key to committee_types
- name: Committee name
- name_bn: Bengali name
- meeting_date: Date of committee meeting
- election_date: Date of election (if applicable)
- effective_date: Start date (user provided)
- end_date: End date (auto-calculated = effective_date + validity_period)
- member_count: Selected member count (3, 6, 9, or 12)
- status: draft|submitted|approved|rejected
- remarks: Additional remarks
- created_by: User ID who created
- updated_by: User ID who last updated
- timestamps
```

### committee_members
```
- id: Primary Key
- committee_id: Foreign Key to committees
- member_info_id: Foreign Key to member_infos
- designation: Position (Chairman, Vice-Chairman, Member, etc)
- position: Order in committee
- mobile: Contact number
- email: Email address
- remarks: Additional notes
- timestamps
```

### committee_documents
```
- id: Primary Key
- committee_id: Foreign Key to committees
- document_name: Name of document
- document_type: Type (meeting_minutes, election_record, etc)
- file_path: Storage path
- file_name: Original file name
- file_size: Size in bytes
- uploaded_by: User ID who uploaded
- remarks: Notes
- timestamps
```

### committee_elections
```
- id: Primary Key
- committee_id: Foreign Key to committees
- election_date: Date of election
- election_venue: Location of election
- total_members: Number of eligible members
- total_votes_cast: Number of votes received
- status: scheduled|completed|cancelled
- remarks: Additional remarks
- created_by: User ID
- updated_by: User ID
- timestamps
```

## API Endpoints

### Committee Types

#### List all committee types
```
GET /api/committee-types
Middleware: permission:committee.type.view
```

#### Get active committee types
```
GET /api/committee-types-active
Middleware: permission:committee.view
```

#### Create new committee type
```
POST /api/committee-types
Middleware: permission:committee.type.create
Body:
{
  "name": "Committee Type Name",
  "name_bn": "কমিটি প্রকার নাম",
  "description": "Description",
  "validity_period": 3,
  "member_count_options": [3, 6, 9, 12],
  "is_active": true
}
```

#### Get committee type by ID
```
GET /api/committee-types/{id}
Middleware: permission:committee.type.view
```

#### Update committee type
```
PUT /api/committee-types/{id}
Middleware: permission:committee.type.edit
Body: Same as create
```

#### Delete committee type
```
DELETE /api/committee-types/{id}
Middleware: permission:committee.type.delete
```

### Committees

#### List all committees
```
GET /api/committees?samity_id={id}&status={status}&page={page}
Middleware: permission:committee.view
Query Parameters:
- samity_id: Filter by Samity
- status: Filter by status (draft, submitted, approved, rejected)
- page: Pagination
```

#### Create new committee
```
POST /api/committees
Middleware: permission:committee.create
Body:
{
  "samity_id": 1,
  "committee_type_id": 1,
  "name": "Committee Name",
  "name_bn": "কমিটি নাম",
  "meeting_date": "2026-03-15",
  "election_date": "2026-04-15",
  "effective_date": "2026-02-25",
  "member_count": 6,
  "members": [
    {
      "member_info_id": 1,
      "designation": "Chairman",
      "position": 1
    },
    ...
  ],
  "documents": [multipart file uploads]
}
```

#### Get committee by ID
```
GET /api/committees/{id}
Middleware: permission:committee.view
```

#### Update committee (only draft status)
```
PUT /api/committees/{id}
Middleware: permission:committee.edit
Body: Same as create (but member_count cannot change if members assigned)
```

#### Submit committee for approval
```
POST /api/committees/{id}/submit
Middleware: permission:committee.create
Validates:
- Member count matches actual members assigned
- All required documents uploaded
- Transition from draft to submitted
```

#### Approve committee
```
POST /api/committees/{id}/approve
Middleware: permission:committee.approve
Body:
{
  "remarks": "Approval remarks"
}
```

#### Reject committee
```
POST /api/committees/{id}/reject
Middleware: permission:committee.approve
Body:
{
  "remarks": "Rejection reason"
}
```

#### Get available members for committee
```
GET /api/committees-available-members?samity_id={id}
Middleware: permission:committee.view
Returns: List of active members from specified Samity
```

#### Delete committee (only draft status)
```
DELETE /api/committees/{id}
Middleware: permission:committee.delete
```

## Permissions

| Permission | Description |
|-----------|-------------|
| committee.type.view | View committee types |
| committee.type.create | Create committee types |
| committee.type.edit | Edit committee types |
| committee.type.delete | Delete committee types |
| committee.view | View committees |
| committee.create | Create committees and submit |
| committee.edit | Edit committees |
| committee.delete | Delete committees |
| committee.approve | Approve/Reject committees |

## Menu Structure

```
Committee Management
├── Committee Types
├── Committees
└── Committee Reports
```

## Business Logic

### End Date Auto-Calculation
When creating or updating a committee, the end_date is automatically calculated as:
```
end_date = effective_date + CommitteeType.validity_period (in years)
```

### Member Count Validation
- Member count options come from CommitteeType configuration: [3, 6, 9, 12]
- Actual assigned members must exactly match the selected member_count
- Each member must have a designation

### Status Workflow
```
Draft → Submitted → Approved/Rejected

- Draft: Initial state, editable and deletable
- Submitted: Committee submitted for approval, not editable
- Approved: Committee approved by authority
- Rejected: Committee rejected, cannot be resubmitted
```

### Document Upload
- Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
- Maximum file size: 5MB per file
- Files stored in: `public/committee_documents/`
- Storage path format: `committee_documents/{committee_id}/{timestamp}_{filename}`

## Example Usage

### Create a Committee with Members and Documents
```bash
curl -X POST http://localhost:8000/api/committees \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: multipart/form-data" \
  -F "samity_id=1" \
  -F "committee_type_id=1" \
  -F "name=Executive Committee" \
  -F "name_bn=নির্বাহী কমিটি" \
  -F "meeting_date=2026-03-15" \
  -F "effective_date=2026-02-25" \
  -F "member_count=3" \
  -F "members[0][member_info_id]=1" \
  -F "members[0][designation]=Chairman" \
  -F "members[0][position]=1" \
  -F "members[1][member_info_id]=2" \
  -F "members[1][designation]=Vice Chairman" \
  -F "members[1][position]=2" \
  -F "members[2][member_info_id]=3" \
  -F "members[2][designation]=Member" \
  -F "members[2][position]=3" \
  -F "documents[0]=@meeting_minutes.pdf" \
  -F "documents[1]=@nid_copy.jpg"
```

### Submit Committee for Approval
```bash
curl -X POST http://localhost:8000/api/committees/1/submit \
  -H "Authorization: Bearer {token}"
```

### Approve Committee
```bash
curl -X POST http://localhost:8000/api/committees/1/approve \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"remarks": "Approved by management"}'
```

## Error Handling

All API endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 403: Forbidden (permission denied)
- 404: Not Found
- 422: Unprocessable Entity (data validation failed)
- 500: Server Error

Error response format:
```json
{
  "message": "Error description",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

## File Structure

```
app/
├── Models/
│   ├── CommitteeType.php
│   ├── Committee.php
│   ├── CommitteeMember.php
│   ├── CommitteeDocument.php
│   └── CommitteeElection.php
├── Http/Controllers/Api/
│   ├── CommitteeTypeController.php
│   └── CommitteeController.php
database/
├── migrations/
│   └── 2026_02_25_create_committee_tables.php
└── seeders/
    ├── CommitteePermissionSeeder.php
    ├── CommitteeTypeSeeder.php
    └── CommitteeMenuSeeder.php
routes/
└── api.php (Committee routes added)
```

## Notes

- All timestamps are in UTC format
- Bengali names (name_bn) are optional but recommended
- The system uses soft deletes pattern - deleted records can be recovered
- All operations are logged in audit_logs table for compliance
- File uploads are stored with user_id tracking for audit purposes
