import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const dataDir = process.env.DATA_DIR || join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'scans.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Check if a column exists in a table
 */
function columnExists(tableName, columnName) {
  try {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      console.warn(`Invalid table name: ${tableName}`);
      return false;
    }
    
    // SQLite pragma_table_info doesn't support parameters for table name, so we need to use string interpolation
    // This is safe here because we validate the table name above
    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM pragma_table_info('${tableName}')
      WHERE name = ?
    `).get(columnName);
    return result.count > 0;
  } catch {
    return false;
  }
}

/**
 * Run database migrations
 */
function runMigrations() {
  // Migration: Add folder_id column to scans table if it doesn't exist
  try {
    const scansTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='scans'
    `).get();

    if (scansTableExists && !columnExists('scans', 'folder_id')) {
      console.log('🔄 Migrating: Adding folder_id column to scans table...');
      db.exec(`
        ALTER TABLE scans 
        ADD COLUMN folder_id TEXT;
      `);
      console.log('✅ Migration complete: folder_id column added');
    }


    if (scansTableExists && !columnExists('scans', 'scope_full_targets')) {
      console.log('🔄 Migrating: Adding scope_full_targets column to scans table...');
      db.exec(`
        ALTER TABLE scans 
        ADD COLUMN scope_full_targets TEXT;
      `);
      console.log('✅ Migration complete: scope_full_targets column added');
    }
  } catch (error) {
    console.warn('⚠️  Migration check failed:', error.message);
  }
}

/**
 * Initialize database schema
 */
export function initDatabase() {
  // Folders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
    )
  `);

  // Scans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filename TEXT,
      folder_id TEXT,
      scanner TEXT,
      args TEXT,
      start_time TEXT,
      start_time_str TEXT,
      version TEXT,
      xmloutputversion TEXT,
      scope_type TEXT,
      scope_display TEXT,
      scope_note TEXT,
      scope_file TEXT,
      scope_discovered_count INTEGER,
      scope_full_targets TEXT,
      total_hosts INTEGER DEFAULT 0,
      total_ports INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    )
  `);

  // Run migrations for existing databases
  runMigrations();

  // Hosts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id TEXT NOT NULL,
      status_state TEXT,
      status_reason TEXT,
      status_reason_ttl TEXT,
      os_name TEXT,
      os_accuracy TEXT,
      uptime_seconds TEXT,
      uptime_lastboot TEXT,
      distance_value TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
    )
  `);

  // Addresses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id INTEGER NOT NULL,
      addr TEXT NOT NULL,
      addrtype TEXT NOT NULL,
      FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE CASCADE
    )
  `);

  // Hostnames table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hostnames (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE CASCADE
    )
  `);

  // Ports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id INTEGER NOT NULL,
      protocol TEXT NOT NULL,
      portid TEXT NOT NULL,
      state_state TEXT,
      state_reason TEXT,
      state_reason_ttl TEXT,
      service_name TEXT,
      service_product TEXT,
      service_version TEXT,
      service_extrainfo TEXT,
      service_method TEXT,
      service_conf TEXT,
      FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE CASCADE
    )
  `);

  // Scripts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      port_id INTEGER NOT NULL,
      script_id TEXT NOT NULL,
      output TEXT,
      raw_output TEXT,
      FOREIGN KEY (port_id) REFERENCES ports(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_hosts_scan_id ON hosts(scan_id);
      CREATE INDEX IF NOT EXISTS idx_addresses_host_id ON addresses(host_id);
      CREATE INDEX IF NOT EXISTS idx_hostnames_host_id ON hostnames(host_id);
      CREATE INDEX IF NOT EXISTS idx_ports_host_id ON ports(host_id);
      CREATE INDEX IF NOT EXISTS idx_scripts_port_id ON scripts(port_id);
    `);

    // Only create folder_id index if the column exists
    if (columnExists('scans', 'folder_id')) {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_scans_folder_id ON scans(folder_id);`);
    }

    db.exec(`CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);`);
  } catch (error) {
    console.warn('⚠️  Some indexes could not be created:', error.message);
  }

  console.log('✅ Database initialized');
}

/**
 * Get database instance
 */
export function getDatabase() {
  return db;
}

