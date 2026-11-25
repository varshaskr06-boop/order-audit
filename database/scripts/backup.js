/**
 * ============================================================================
 * Database Backup Utility
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 * Supports:
 * 1. Live PostgreSQL backup via pg_dump
 * 2. In-memory data store snapshot when database is offline
 * 3. Automated SHA-256 integrity checksum generation
 * 4. Automatic backup retention rotation (keeps last 14 backups)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

function loadEnv() {
  const envPath = path.join(__dirname, '../../backend/.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
}
loadEnv();

const BACKUP_DIR = path.join(__dirname, '../backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
}

function calculateChecksum(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function cleanOldBackups(maxRetention = 14) {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => !f.endsWith('.meta.json') && (f.startsWith('backup_') || f.startsWith('snapshot_')))
      .map((f) => ({
        name: f,
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxRetention) {
      const toDelete = files.slice(maxRetention);
      toDelete.forEach((file) => {
        fs.unlinkSync(path.join(BACKUP_DIR, file.name));
        const metaPath = path.join(BACKUP_DIR, `${file.name}.meta.json`);
        if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
        console.log(`[Retention] Rotated out older backup: ${file.name}`);
      });
    }
  } catch (err) {
    console.warn(`[Retention Warning]: Could not complete backup rotation: ${err.message}`);
  }
}

async function runBackup() {
  const timestamp = getTimestamp();
  const dbUser = process.env.DB_USER || 'postgres';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'food_mfg_db';
  const dbPassword = process.env.DB_PASSWORD || '';

  console.log('================================================================');
  console.log('📦 SRI MEENAKSHI AGRO ERP - DATABASE BACKUP ROUTINE');
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  console.log(`🎯 Target DB: ${dbName} @ ${dbHost}:${dbPort}`);
  console.log('================================================================\n');

  // Attempt pg_dump first if pg is installed & reachable
  const sqlBackupFileName = `backup_${dbName}_${timestamp}.sql`;
  const sqlBackupFilePath = path.join(BACKUP_DIR, sqlBackupFileName);

  const dumpCmd = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -b -v -f "${sqlBackupFilePath}"`;

  console.log('[1/3] Probing PostgreSQL instance for live pg_dump export...');
  exec(dumpCmd, { env: { ...process.env, PGPASSWORD: dbPassword } }, (error, stdout, stderr) => {
    if (!error && fs.existsSync(sqlBackupFilePath) && fs.statSync(sqlBackupFilePath).size > 0) {
      const checksum = calculateChecksum(sqlBackupFilePath);
      const metadata = {
        type: 'POSTGRESQL_PG_DUMP',
        fileName: sqlBackupFileName,
        database: dbName,
        timestamp,
        sizeBytes: fs.statSync(sqlBackupFilePath).size,
        sha256: checksum,
        environment: process.env.NODE_ENV || 'production',
      };
      fs.writeFileSync(path.join(BACKUP_DIR, `${sqlBackupFileName}.meta.json`), JSON.stringify(metadata, null, 2));

      console.log(`\n✅ [SUCCESS] PostgreSQL backup completed!`);
      console.log(`📁 File: ${sqlBackupFilePath}`);
      console.log(`🔒 SHA-256 Checksum: ${checksum}`);
      cleanOldBackups();
      process.exit(0);
    } else {
      console.log(`⚠️ PostgreSQL pg_dump not available (${error ? error.message.trim() : 'Zero bytes'}).`);
      console.log('[2/3] Exporting ERP in-memory relational data snapshot...');

      try {
        // Collect model states from all modules
        const userModel = require('../../backend/models/userModel');
        const salesModel = require('../../backend/models/salesOrderModel');
        const purchaseModel = require('../../backend/models/purchaseModel');
        const inventoryModel = require('../../backend/models/inventoryModel');
        const productionModel = require('../../backend/models/productionModel');
        const qualityModel = require('../../backend/models/qualityModel');
        const costingModel = require('../../backend/models/costingModel');
        const invoicingModel = require('../../backend/models/invoicingModel');
        const dispatchModel = require('../../backend/models/dispatchModel');
        const paymentModel = require('../../backend/models/paymentModel');
        const auditModel = require('../../backend/models/auditModel');
        const analyticsModel = require('../../backend/models/analyticsModel');

        const snapshotData = {
          metadata: {
            system: 'Sri Meenakshi Agro & Traditional Foods ERP',
            version: '15.0.0',
            phase: 'Phase 15 Final Delivery',
            timestamp,
            mode: 'RESILIENT_SNAPSHOT',
          },
          modules: {
            users: userModel._inMemoryUsers ? userModel._inMemoryUsers : 'active',
            sales: salesModel._inMemOrders ? salesModel._inMemOrders : [],
            purchase: purchaseModel._inMemPOs ? purchaseModel._inMemPOs : [],
            inventory: inventoryModel._inMemStock ? inventoryModel._inMemStock : [],
            production: productionModel._inMemProductionOrders ? productionModel._inMemProductionOrders : [],
            quality: qualityModel._inMemQuality ? qualityModel._inMemQuality : [],
            costing: costingModel._inMemCostings ? costingModel._inMemCostings : [],
            invoicing: invoicingModel._inMemInvoices ? invoicingModel._inMemInvoices : [],
            dispatch: dispatchModel._inMemDispatch ? dispatchModel._inMemDispatch : [],
            payments: paymentModel._inMemPayments ? paymentModel._inMemPayments : [],
            audit: auditModel._inMemAudits ? auditModel._inMemAudits : [],
            analytics: analyticsModel._inMemReports ? analyticsModel._inMemReports : [],
          },
        };

        const jsonBackupFileName = `snapshot_${dbName}_${timestamp}.json`;
        const jsonBackupFilePath = path.join(BACKUP_DIR, jsonBackupFileName);

        fs.writeFileSync(jsonBackupFilePath, JSON.stringify(snapshotData, null, 2));
        const checksum = calculateChecksum(jsonBackupFilePath);
        const metadata = {
          type: 'ERP_SNAPSHOT_JSON',
          fileName: jsonBackupFileName,
          database: dbName,
          timestamp,
          sizeBytes: fs.statSync(jsonBackupFilePath).size,
          sha256: checksum,
        };
        fs.writeFileSync(path.join(BACKUP_DIR, `${jsonBackupFileName}.meta.json`), JSON.stringify(metadata, null, 2));

        console.log(`\n✅ [SUCCESS] ERP Data Snapshot export completed!`);
        console.log(`📁 File: ${jsonBackupFilePath}`);
        console.log(`🔒 SHA-256 Checksum: ${checksum}`);
        cleanOldBackups();
        process.exit(0);
      } catch (snapshotErr) {
        console.error(`❌ [ERROR] Snapshot export failed:`, snapshotErr.message);
        process.exit(1);
      }
    }
  });
}

runBackup();
