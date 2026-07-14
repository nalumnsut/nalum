/**
 * Loads all seed files in dependency order (users before profiles, since
 * profiles reference a user). Run: node scripts/seed/index.js
 *
 * Add a new collection's seed by creating scripts/seed/<collection>.js
 * (data + a seed<Collection>() export) and requiring/calling it here.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../../config/database.config');
const { seedUsers } = require('./users');
const { seedProfiles } = require('./profiles');
const { seedEvents } = require('./events');
const { seedPosts } = require('./posts');
const { seedConnections } = require('./connections');
const { seedAlumniPg } = require('./alumni_pg');

async function main() {
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

  console.log('\n🌱 Seeding alumni (Postgres)...\n');
  await seedAlumniPg();

  console.log('\n✨ Seeding complete.');
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
