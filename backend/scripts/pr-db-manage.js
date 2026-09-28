#!/usr/bin/env node

/**
 * PR Database Manager — CLI tool for GitHub Actions.
 *
 * Creates, drops, or verifies a PR-specific MongoDB database.
 * Designed to be called from CI with the PR-specific MONGODB_URI already set.
 *
 * Usage:
 *   MONGODB_URI=<pr-uri> node backend/scripts/pr-db-manage.js create
 *   MONGODB_URI=<pr-uri> node backend/scripts/pr-db-manage.js drop
 *   MONGODB_URI=<pr-uri> node backend/scripts/pr-db-manage.js verify
 *
 * Safety:
 *   - Refuses to drop any database whose name does not match /_pr_\d+$/
 *   - Logs every operation for CI output visibility
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const PR_DB_PATTERN = /_pr_\d+$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractDbName(uri) {
  try {
    // Handle both mongodb:// and mongodb+srv:// URIs
    const url = new URL(uri);
    // The DB name is the pathname without the leading slash
    const dbName = url.pathname.replace(/^\//, '').split('?')[0];
    return dbName || null;
  } catch {
    // Fallback: try to extract from the URI string directly
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : null;
  }
}

function isPrDatabase(dbName) {
  return PR_DB_PATTERN.test(dbName);
}

function log(emoji, message) {
  console.log(`${emoji}  ${message}`);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function createDb() {
  log('🔧', `Connecting to: ${MONGODB_URI.replace(/\/\/[^@]+@/, '//***:***@')}`);

  const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
  const dbName = conn.db.databaseName;

  log('📦', `Database name: ${dbName}`);

  if (!isPrDatabase(dbName)) {
    log('❌', `SAFETY: "${dbName}" does not match PR database pattern (${PR_DB_PATTERN}). Aborting.`);
    await conn.close();
    process.exit(1);
  }

  // MongoDB creates databases lazily — we must write something to materialize it.
  // Use a temporary collection that we immediately drop.
  const tempCollection = conn.db.collection('_pr_db_init');
  await tempCollection.insertOne({ _created: new Date(), purpose: 'database initialization' });
  await tempCollection.drop();

  // Verify the database now exists by listing collections
  const collections = await conn.db.listCollections().toArray();
  log('✅', `Database "${dbName}" initialized (${collections.length} collections)`);

  await conn.close();
}

async function dropDb() {
  log('🔧', `Connecting to: ${MONGODB_URI.replace(/\/\/[^@]+@/, '//***:***@')}`);

  const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
  const dbName = conn.db.databaseName;

  log('📦', `Database name: ${dbName}`);

  // Critical safety checks
  if (!isPrDatabase(dbName)) {
    log('❌', `SAFETY: "${dbName}" does not match PR database pattern (${PR_DB_PATTERN}). REFUSING TO DROP.`);
    await conn.close();
    process.exit(1);
  }

  if (dbName === 'nalum') {
    log('❌', `SAFETY: Refusing to drop the production database "nalum".`);
    await conn.close();
    process.exit(1);
  }

  // Check if the database actually has any collections
  const collections = await conn.db.listCollections().toArray();

  if (collections.length === 0) {
    log('⚠️', `Database "${dbName}" has no collections — may already be dropped. Skipping.`);
    await conn.close();
    return;
  }

  log('🗑️', `Dropping database "${dbName}" (${collections.length} collections)...`);
  await conn.db.dropDatabase();
  log('✅', `Database "${dbName}" dropped successfully.`);

  await conn.close();
}

async function verifyDb() {
  log('🔧', `Connecting to: ${MONGODB_URI.replace(/\/\/[^@]+@/, '//***:***@')}`);

  const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
  const dbName = conn.db.databaseName;

  log('📦', `Database name: ${dbName}`);

  const collections = await conn.db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name).sort();

  if (collections.length === 0) {
    log('⚠️', `Database "${dbName}" exists but has no collections.`);
  } else {
    log('✅', `Database "${dbName}" has ${collections.length} collection(s): ${collectionNames.join(', ')}`);
  }

  // Count documents in each collection for a quick summary
  for (const name of collectionNames) {
    const count = await conn.db.collection(name).countDocuments();
    log('  📊', `${name}: ${count} document(s)`);
  }

  await conn.close();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const COMMANDS = { create: createDb, drop: dropDb, verify: verifyDb };

async function main() {
  const command = process.argv[2];

  if (!command || !COMMANDS[command]) {
    console.error(`Usage: node pr-db-manage.js <create|drop|verify>`);
    console.error(`  MONGODB_URI must be set as an environment variable.`);
    process.exit(1);
  }

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set.');
    process.exit(1);
  }

  const dbName = extractDbName(MONGODB_URI);
  if (dbName) {
    log('🎯', `Target database: ${dbName}`);
  }

  try {
    await COMMANDS[command]();
  } catch (err) {
    log('❌', `Command "${command}" failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
