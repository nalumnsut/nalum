/**
 * MongoDB-only seed runner — for CI / PR database seeding.
 *
 * Runs all the Mongo seed functions (users, profiles, events, posts,
 * connections) but intentionally SKIPS the Postgres alumni seed, since
 * PR databases only isolate MongoDB.
 *
 * Usage:
 *   MONGODB_URI=<pr-uri> node backend/scripts/seed/seed-mongo-only.js
 *
 * This reuses the existing seed functions from the same directory —
 * no duplication. All seed functions are already idempotent (they skip
 * records that already exist), so this is safe to run multiple times.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../../config/database.config');
const { seedUsers } = require('./users');
const { seedProfiles } = require('./profiles');
const { seedEvents } = require('./events');
const { seedPosts } = require('./posts');
const { seedConnections } = require('./connections');

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set.');
    process.exit(1);
  }

  console.log(`\n🎯 Seeding MongoDB database from MONGODB_URI`);
  console.log(`   (Postgres alumni seed is SKIPPED — MongoDB only)\n`);

  await connectDB();

  console.log('\n🌱 Seeding users...\n');
  await seedUsers();

  console.log('\n🌱 Seeding profiles...\n');
  await seedProfiles();

  console.log('\n🌱 Seeding events...\n');
  await seedEvents();

  console.log('\n🌱 Seeding posts...\n');
  await seedPosts();

  console.log('\n🌱 Seeding connections...\n');
  await seedConnections();

  console.log('\n✨ MongoDB seeding complete (Postgres skipped).');
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
