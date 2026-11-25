# Database Backup & Disaster Recovery Guide
## Sri Meenakshi Agro & Traditional Foods ERP System

This guide details the backup mechanisms, retention policies, integrity verification, and recovery procedures for the ERP database.

---

## 1. Backup Strategy Overview

The system implements a dual-mode backup strategy:
1. **Physical SQL Dump (`pg_dump`):** When PostgreSQL is running, exports full DDL schemas, constraints, sequences, and table records into `database/backups/backup_<dbname>_<timestamp>.sql`.
2. **Resilient JSON Snapshot:** When running in in-memory mode or during network isolation, serializes active relational entities across all 12 operational modules into `database/backups/snapshot_<dbname>_<timestamp>.json`.
3. **SHA-256 Checksum Manifest:** Every backup produces an accompanying `.meta.json` file containing file size, timestamp, backup type, and a cryptographic SHA-256 hash.

---

## 2. Automated & Manual Backup Execution

### 2.1 Running Backup via Node.js
From the project root:
```powershell
node database/scripts/backup.js
```

### 2.2 Running Backup via PowerShell
```powershell
.\database\scripts\backup.ps1
```

### 2.3 Sample Output
```text
================================================================
📦 SRI MEENAKSHI AGRO ERP - DATABASE BACKUP ROUTINE
🕒 Timestamp: 2026-11-23T09:29:31.283Z
🎯 Target DB: food_mfg_db @ localhost:5432
================================================================

[1/3] Probing PostgreSQL instance for live pg_dump export...
[2/3] Exporting ERP in-memory relational data snapshot...

✅ [SUCCESS] ERP Data Snapshot export completed!
📁 File: C:\Users\asaab\Desktop\NIT\database\backups\snapshot_food_mfg_db_2026-11-23.json
🔒 SHA-256 Checksum: ed138a8944eee69374938f8a8149a8af6ea8050ac6d5bae2cf220a1145a73637
```

---

## 3. Retention & Rotation Policy

- Backups are automatically retained for **14 cycles** (equivalent to 14 daily backups).
- On each execution, `cleanOldBackups()` sorts all files in `database/backups/` by modification time and purges backups older than the 14 most recent entries along with their corresponding `.meta.json` checksum files.

---

## 4. Disaster Recovery & Restoration Procedures

### 4.1 Restoring the Latest Backup Automatically
```powershell
node database/scripts/restore.js
```
The restore utility automatically locates the most recent valid backup file, performs a SHA-256 integrity validation against its metadata, and applies it.

### 4.2 Restoring a Specific Backup File
```powershell
node database/scripts/restore.js "backup_food_mfg_db_2026-11-23.sql"
```

### 4.3 Verifying Backup File Integrity
The restoration process calculates the cryptographic SHA-256 hash before executing any restoration queries:
```text
✅ [Integrity] SHA-256 Checksum verified successfully.
[1/2] Parsing and validating JSON snapshot structure...
  - System: Sri Meenakshi Agro & Traditional Foods ERP
  - Phase:  Phase 15 Final Delivery
  - Modules present: users, sales, purchase, inventory, production, quality, costing, invoicing, dispatch, payments, audit, analytics

✅ [SUCCESS] JSON data snapshot verified and ready for memory/seed hydration.
```
If a file has been modified or corrupted, the restore routine immediately aborts with:
`🚨 INTEGRITY MISMATCH! The backup file checksum does not match its metadata!`
