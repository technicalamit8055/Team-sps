# Voter CSV Import Documentation

## Overview

The CSV Importer allows administrators to bulk-upload voter data into the Victory campaign management system. It supports comprehensive voter records with 20+ fields, handles duplicates intelligently, and provides real-time progress tracking.

---

## Access Requirements

| Role | Access Level |
|------|--------------|
| Admin | Full access - can upload and manage voter data |
| Manager | View only |
| Worker | No access |

---

## CSV File Format

### Required Columns

| Column | Database Field | Description | Example |
|--------|----------------|-------------|---------|
| `EPIC NO` | `epic_no` | Unique voter ID (Electoral Photo ID) | `ABC1234567` |
| `NAME IN ENGLISH` or `NAME` | `name_english`, `name` | Voter's name in English | `Rajesh Kumar` |
| `WARD NO` or `WARD` | `ward` | Ward number (integer) | `5` |

### Optional Columns

| Column Variations | Database Field | Description | Example |
|-------------------|----------------|-------------|---------|
| `S.L NO`, `SL NO`, `SLNO` | `sl_no` | Serial number | `142` |
| `NAME IN HINDI` | `name_hindi` | Name in Hindi script | `राजेश कुमार` |
| `GUARDIAN NAME IN ENGLISH`, `FATHER NAME` | `guardian_name_english` | Guardian/Father name (English) | `Ram Kumar` |
| `GUARDIAN NAME IN HINDI` | `guardian_name_hindi` | Guardian name (Hindi) | `राम कुमार` |
| `RELATION TYPE`, `REL`, `FAT/HUS/MOT` | `relation_type` | Relation to guardian | `FAT`, `HUS`, `MOT` |
| `GENDER`, `SEX` | `gender` | Gender | `M`, `F`, `Male`, `Female` |
| `AGE` | `age` | Age in years | `45` |
| `HOUSE NO`, `HOUSE`, `Address` | `house_no` | House number | `A-123` |
| `CASTE` | `caste` | Caste category | `General`, `OBC`, `SC`, `ST` |
| `ADDRESS 1`, `ADDRESS1` | `address_1` | Address line 1 | `Street name` |
| `ADDRESS 2`, `ADDRESS2` | `address_2` | Address line 2 | `Locality` |
| `ADDRESS 3`, `ADDRESS3` | `address_3` | Address line 3 | `Landmark` |
| `MAIN MAN FAMILY`, `FAMILY HEAD` | `main_man_family` | Family head name | `Ram Kumar` |
| `IMPACT LEVEL`, `IMPACT` | `impact_level` | Influence level | `high`, `medium`, `low` |
| `IS ALIVE`, `ALIVE` | `is_alive` | Living status | `L` (Living), `D` (Deceased) |
| `VOTER STATUS`, `V_STATUS` | `voter_status` | Custom voter status | `active`, `migrated` |
| `PHONE`, `MOBILE` | `phone` | Phone number | `9876543210` |
| `BOOTH`, `BOOTH NO` | `booth` | Booth number/name | `12`, `Booth-A` |

---

## Sample CSV Template

```csv
WARD NO,S.L NO,NAME IN ENGLISH,NAME IN HINDI,GUARDIAN NAME IN ENGLISH,GUARDIAN NAME IN HINDI,GENDER,RELATION TYPE,AGE,EPIC NO,HOUSE NO,CASTE,ADDRESS 1,ADDRESS 2,ADDRESS 3,MAIN MAN FAMILY,IMPACT LEVEL,IS ALIVE,VOTER STATUS,PHONE,BOOTH
1,1,Rajesh Kumar,राजेश कुमार,Ram Kumar,राम कुमार,M,FAT,45,ABC1234567,A-123,General,Main Road,Block A,Near Temple,Ram Kumar,high,L,active,9876543210,12
1,2,Priya Sharma,प्रिया शर्मा,Mohan Sharma,मोहन शर्मा,F,FAT,32,XYZ9876543,B-456,OBC,Second Street,Block B,Near School,Mohan Sharma,medium,L,active,9988776655,12
2,1,Amit Singh,अमित सिंह,Suresh Singh,सुरेश सिंह,M,FAT,55,DEF5555555,C-789,SC,Third Lane,Block C,,Suresh Singh,low,L,active,,15
```

---

## Data Processing Rules

### 1. EPIC NO Normalization
Before processing, all EPIC numbers are normalized:
- **Trimmed**: Leading/trailing whitespace removed
- **Uppercased**: Converted to uppercase
- **Spaces removed**: Internal spaces collapsed

Example: `" abc 123 def "` → `"ABC123DEF"`

### 2. Duplicate Handling

#### Within the Same Upload
- Duplicate EPIC NOs are automatically **merged**
- **Last occurrence wins** - if the same EPIC appears multiple times, the last row's data is used
- Duplicate count is shown in the status log

#### Across Multiple Uploads
- Uses **upsert** (UPDATE or INSERT)
- Existing records with matching EPIC NO are **updated**
- New EPIC NOs are **inserted**
- Safe to re-upload the same file

### 3. Records Without EPIC NO
- Records missing EPIC NO are **skipped** and not uploaded
- Count of skipped records shown in logs
- Other fields are not sufficient for unique identification

### 4. Living Status Parsing
The `is_alive` field is parsed as follows:
- `L`, `l`, `Living`, `TRUE`, `1` → `true` (Living)
- `D`, `d`, `Deceased`, `FALSE`, `0` → `false` (Deceased)
- Empty or missing → `true` (default to Living)

---

## Upload Process

### Batch Processing
- Records are uploaded in batches of **500**
- Each batch is deduplicated before sending
- Progress bar shows real-time completion
- Failed batches are logged with error details

### Flow Diagram

```
┌─────────────────┐
│  Select CSV     │
│  File           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse CSV      │
│  (PapaParse)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Preview Data   │
│  (First 5 rows) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Confirms  │
│  Upload         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Normalize      │
│  EPIC Numbers   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Remove Invalid │
│  (No EPIC)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deduplicate    │
│  by EPIC NO     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Batch Upload   │
│  (500/batch)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Show Results   │
│  & Logs         │
└─────────────────┘
```

---

## Status Log Messages

| Log Type | Message Example | Meaning |
|----------|-----------------|---------|
| ℹ️ Info | `File selected: voters.csv` | File loaded |
| ✅ Success | `Parsed 7343 rows successfully` | Parse complete |
| ⚠️ Warning | `86 rows skipped (missing EPIC NO)` | Invalid records skipped |
| ⚠️ Warning | `312 duplicate EPIC NOs merged` | Duplicates found & merged |
| ℹ️ Info | `Processing 6945 unique EPIC records...` | Upload starting |
| ℹ️ Info | `Uploading batch 1/14 (500 rows, Wards: 1, 2)` | Batch progress |
| ✅ Success | `Batch 1 completed successfully` | Batch done |
| ❌ Error | `Batch 3 failed: [error message]` | Batch failed |
| ✅ Success | `✅ Import complete: 6945 success, 0 failed` | Final summary |

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `missing EPIC NO` | Row has empty/blank EPIC column | Add valid EPIC numbers or remove row |
| `duplicate EPIC NOs merged` | Same EPIC appears multiple times | Normal behavior - last occurrence used |
| `RLS policy violation` | User lacks permission | Ensure logged in as Admin |
| `Network error` | Connection issue | Check internet, retry upload |

### Troubleshooting Steps

1. **Check file format**: Ensure it's a valid `.csv` file (not Excel)
2. **Verify headers**: Column names must match expected variations
3. **Login status**: Must be logged in as Admin
4. **Data quality**: Remove rows with missing EPIC numbers
5. **Retry**: Failed batches can be retried by re-uploading

---

## Database Schema Reference

### voters Table Structure

```sql
CREATE TABLE voters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epic_no TEXT UNIQUE NOT NULL,
    ward INTEGER,
    sl_no INTEGER,
    name TEXT NOT NULL,
    name_english TEXT,
    name_hindi TEXT,
    guardian_name_english TEXT,
    guardian_name_hindi TEXT,
    gender TEXT,
    relation_type TEXT,          -- FAT/HUS/MOT
    age INTEGER,
    house_no TEXT,
    caste TEXT,
    address_1 TEXT,
    address_2 TEXT,
    address_3 TEXT,
    main_man_family TEXT,
    impact_level TEXT,
    is_alive BOOLEAN DEFAULT true,
    voter_status TEXT,
    phone TEXT,
    booth TEXT,
    status TEXT DEFAULT 'neutral',  -- support/oppose/neutral
    has_voted BOOLEAN DEFAULT false,
    assigned_worker_id UUID,
    linked_user_id UUID,            -- For future Citizen Login
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

| Policy | Role | Permission |
|--------|------|------------|
| View voters | Admin, Manager, Worker | SELECT |
| Manage voters | Admin, Manager | ALL (INSERT, UPDATE, DELETE) |
| Update assigned | Worker | UPDATE (only assigned voters) |

---

## Best Practices

### Before Import
1. ✅ Remove duplicate EPIC numbers in Excel/Sheets (optional - handled automatically)
2. ✅ Ensure all voters have valid EPIC numbers
3. ✅ Verify column headers match expected format
4. ✅ Save as UTF-8 CSV for Hindi text support
5. ✅ Backup existing data before large imports

### During Import
1. ✅ Watch progress bar and status logs
2. ✅ Note any warning messages about skipped/merged records
3. ✅ Don't close browser during upload

### After Import
1. ✅ Verify total count matches expected
2. ✅ Spot-check a few records in the CRM
3. ✅ Re-upload if batches failed (safe - uses upsert)

---

## Technical Specifications

| Specification | Value |
|---------------|-------|
| Max file size | Limited by browser memory |
| Batch size | 500 records |
| Supported encoding | UTF-8 (recommended), ASCII |
| File format | CSV with headers |
| Conflict handling | Upsert on `epic_no` |
| Deduplication | Client-side, last occurrence wins |

---

## Column Header Aliases

The importer supports multiple header name variations for flexibility:

| Database Field | Accepted Headers |
|----------------|------------------|
| `ward` | `WARD NO`, `Ward No`, `ward_no`, `WARD`, `ward` |
| `sl_no` | `S.L NO`, `SL NO`, `sl_no`, `S.L`, `SLNO`, `Sl No` |
| `name_english` | `NAME IN ENGLISH`, `Name in English`, `name_english`, `NAME_EN`, `NAME`, `name`, `Name` |
| `name_hindi` | `NAME IN HINDI`, `Name in Hindi`, `name_hindi`, `NAME_HI` |
| `guardian_name_english` | `GUARDIAN NAME IN ENGLISH`, `Guardian Name in English`, `guardian_name_english`, `GUARDIAN_NAME_EN`, `GUARDIAN NAME`, `Father Name`, `FATHER NAME` |
| `guardian_name_hindi` | `GUARDIAN NAME IN HINDI`, `Guardian Name in Hindi`, `guardian_name_hindi`, `GUARDIAN_NAME_HI` |
| `gender` | `GENDER`, `Gender`, `gender`, `SEX`, `Sex` |
| `relation_type` | `RELATION TYPE`, `Relation Type`, `relation_type`, `RELATION`, `REL`, `FAT/HUS/MOT` |
| `age` | `AGE`, `Age`, `age` |
| `epic_no` | `EPIC NO`, `Epic No`, `epic_no`, `EPIC`, `VOTER ID`, `Voter ID` |
| `house_no` | `HOUSE NO`, `House No`, `house_no`, `HOUSE`, `Address` |
| `caste` | `CASTE`, `Caste`, `caste` |
| `address_1` | `ADDRESS 1`, `Address 1`, `address_1`, `ADDRESS1` |
| `address_2` | `ADDRESS 2`, `Address 2`, `address_2`, `ADDRESS2` |
| `address_3` | `ADDRESS 3`, `Address 3`, `address_3`, `ADDRESS3` |
| `main_man_family` | `MAIN MAN FAMILY`, `Main Man Family`, `main_man_family`, `FAMILY HEAD` |
| `impact_level` | `IMPACT LEVEL`, `Impact Level`, `impact_level`, `IMPACT` |
| `is_alive` | `IS ALIVE`, `Is Alive`, `is_alive`, `ALIVE`, `STATUS_ALIVE` |
| `voter_status` | `VOTER STATUS`, `Voter Status`, `voter_status`, `V_STATUS` |
| `phone` | `PHONE`, `Phone`, `phone`, `MOBILE`, `Mobile` |
| `booth` | `BOOTH`, `Booth`, `booth`, `BOOTH NO`, `Booth No` |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-01 | Added comprehensive fields: relation_type, addresses, impact_level, is_alive, voter_status, linked_user_id |
| 1.1 | 2025-01 | Added duplicate detection and EPIC normalization |
| 1.0 | 2024-12 | Initial release with basic voter import |
