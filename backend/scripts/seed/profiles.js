/**
 * Profiles collection — seed data and loader.
 * Depends on users.js having already run (looks users up by email).
 * Location data sourced from the existing scripts/add_sample_locations.js.
 */

const User = require('../../models/user/user.model');
const Profile = require('../../models/user/profile.model');
const { alumniData, studentData } = require('./users');

const sampleLocations = [
  { city: 'delhi', country: 'india', lat: 28.6139, lng: 77.209 },
  { city: 'mumbai', country: 'india', lat: 19.076, lng: 72.8777 },
  { city: 'bangalore', country: 'india', lat: 12.9716, lng: 77.5946 },
  { city: 'pune', country: 'india', lat: 18.5204, lng: 73.8567 },
  { city: 'hyderabad', country: 'india', lat: 17.385, lng: 78.4867 },
  { city: 'chennai', country: 'india', lat: 13.0827, lng: 80.2707 },
  { city: 'kolkata', country: 'india', lat: 22.5726, lng: 88.3639 },
  { city: 'ahmedabad', country: 'india', lat: 23.0225, lng: 72.5714 },
  { city: 'new york', country: 'united states', lat: 40.7128, lng: -74.006 },
  { city: 'london', country: 'united kingdom', lat: 51.5074, lng: -0.1278 },
];

async function seedProfiles() {
  // Alumni profiles — get a location, cycling through the sample list.
  for (let i = 0; i < alumniData.length; i++) {
    const a = alumniData[i];
    const user = await User.findOne({ email: a.email });
    if (!user) {
      console.log(`⚠️  no user for ${a.email}, skipping profile`);
      continue;
    }
    const existing = await Profile.findOne({ user: user._id });
    if (existing) {
      console.log(`⚠️  profile for ${a.email} already exists, skipping`);
      continue;
    }
    const loc = sampleLocations[i % sampleLocations.length];
    await Profile.create({
      user: user._id,
      batch: a.batch,
      branch: a.branch,
      campus: a.campus,
      location: { city: loc.city, country: loc.country, lat: loc.lat, lng: loc.lng },
    });
    console.log(`✅ profile: ${a.email} @ ${loc.city}`);
  }

  // Student profiles — no location.
  for (const s of studentData) {
    const user = await User.findOne({ email: s.email });
    if (!user) {
      console.log(`⚠️  no user for ${s.email}, skipping profile`);
      continue;
    }
    const existing = await Profile.findOne({ user: user._id });
    if (existing) {
      console.log(`⚠️  profile for ${s.email} already exists, skipping`);
      continue;
    }
    await Profile.create({
      user: user._id,
      batch: s.batch,
      branch: s.branch,
      campus: s.campus,
    });
    console.log(`✅ profile: ${s.email}`);
  }

  // No profile created for the admin — intentional, see plan discussion.
}

module.exports = { seedProfiles, sampleLocations };
