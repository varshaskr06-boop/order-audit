/**
 * ============================================================================
 * Database Restore Utility
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 * Usage:
 *   node database/scripts/restore.js [optional_backup_filename]
 * If no filename is provided, the most recent backup/snapshot in database/backups/ is used.
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

function calculateChecksum(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function findLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) return null;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => !f.endsWith('.meta.json') && ((f.startsWith('backup_') && f.endsWith('.sql')) || (f.startsWith('snapshot_') && f.endsWith('.json'))))
    .map((f) => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  return files.length > 0 ? files[0] : null;
}

async function runRestore() {
  const targetFileArg = process.argv[2];
  let targetFile;

  if (targetFileArg) {
    targetFile = path.isAbsolute(targetFileArg) ? targetFileArg : path.join(BACKUP_DIR, targetFileArg);
  } else {
    const latest = findLatestBackup();
    if (!latest) {
      console.error('❌ No backup or snapshot files found in database/backups/.');
      process.exit(1);
    }
    targetFile = latest.path;
  }

  if (!fs.existsSync(targetFile)) {
    console.error(`❌ Target restore file does not exist: ${targetFile}`);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🔄 SRI MEENAKSHI AGRO ERP - DATABASE RESTORATION ROUTINE');
  console.log(`📂 Source File: ${path.basename(targetFile)}`);
  console.log(`🕒 Started At:  ${new Date().toISOString()}`);
  console.log('================================================================\n');

  // Verify Checksum if metadata file exists
  const metaFile = `${targetFile}.meta.json`;
  if (fs.existsSync(metaFile)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      const computedHash = calculateChecksum(targetFile);
      if (meta.sha256 && meta.sha256 !== computedHash) {
        console.error('🚨 INTEGRITY MISMATCH! The backup file checksum does not match its metadata!');
        console.error(`   Expected: ${meta.sha256}`);
        console.error(`   Found:    ${computedHash}`);
        process.exit(1);
      }
      console.log('✅ [Integrity] SHA-256 Checksum verified successfully.');
    } catch (e) {
      console.warn('⚠️ Could not verify metadata checksum:', e.message);
    }
  }

  const isSql = targetFile.endsWith('.sql');
  const isJson = targetFile.endsWith('.json');

  if (isSql) {
    const dbUser = process.env.DB_USER || 'postgres';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'food_mfg_db';
    const dbPassword = process.env.DB_PASSWORD || '';

    console.log(`[1/2] Restoring PostgreSQL database '${dbName}' via psql...`);
    const psqlCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${targetFile}"`;

    exec(psqlCmd, { env: { ...process.env, PGPASSWORD: dbPassword } }, (err, stdout, stderr) => {
      if (err) {
        console.error('❌ [ERROR] PostgreSQL restoration failed:', err.message);
        process.exit(1);
      }
      console.log('✅ [SUCCESS] PostgreSQL database restored successfully from SQL dump.');
      process.exit(0);
    });
  } else if (isJson) {
    console.log('[1/2] Parsing and validating JSON snapshot structure...');
    try {
      const content = fs.readFileSync(targetFile, 'utf8');
      const parsed = JSON.parse(content);
      console.log(`  - System: ${parsed.metadata?.system || 'Unknown'}`);
      console.log(`  - Phase:  ${parsed.metadata?.phase || 'Unknown'}`);
      console.log(`  - Modules present: ${Object.keys(parsed.modules || {}).join(', ')}`);
      console.log('\n✅ [SUCCESS] JSON data snapshot verified and ready for memory/seed hydration.');
      process.exit(0);
    } catch (err) {
      console.error('❌ [ERROR] Invalid JSON snapshot file:', err.message);
      process.exit(1);
    }
  }
}

runRestore();
