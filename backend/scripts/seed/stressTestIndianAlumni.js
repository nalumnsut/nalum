/**
 * Indian Alumni Geolocation Stress-Testing Seed Script
 *
 * Seeds 100 verified alumni profiles distributed across 30+ Indian cities
 * with slight coordinate variations (jitter), aliases (e.g. gurgaon vs gurugram,
 * bangalore vs bengaluru, delhi vs new delhi), and test cases to verify map accuracy.
 *
 * Usage:
 *   node backend/scripts/seed/stressTestIndianAlumni.js         (seeds 100 Indian alumni)
 *   node backend/scripts/seed/stressTestIndianAlumni.js --clean (removes stress test alumni)
 */

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nalum";

const User = require("../../models/user/user.model");
const Profile = require("../../models/user/profile.model");
const { CANONICAL_CITIES, normalizeCityAndCountry } = require("../../config/canonicalCities");
const { invalidateAlumniMapCache } = require("../../config/cacheKeys");

const isCleanMode = process.argv.includes("--clean");

const STRESS_CITIES = [
  // Delhi NCR (testing alias merging into New Delhi & Gurugram)
  { city: "new delhi", country: "india", count: 18 },
  { city: "delhi", country: "india", count: 12 },
  { city: "delhi ncr", country: "india", count: 5 },
  { city: "gurugram", country: "india", count: 8 },
  { city: "gurgaon", country: "india", count: 6 },
  { city: "noida", country: "india", count: 7 },
  { city: "faridabad", country: "india", count: 3 },
  { city: "ghaziabad", country: "india", count: 4 },

  // South India (testing Bengaluru & Chennai aliases)
  { city: "bengaluru", country: "india", count: 10 },
  { city: "bangalore", country: "india", count: 8 },
  { city: "banglore", country: "india", count: 2 },
  { city: "hyderabad", country: "india", count: 6 },
  { city: "chennai", country: "india", count: 5 },
  { city: "kochi", country: "india", count: 2 },

  // West & Central India
  { city: "mumbai", country: "india", count: 8 },
  { city: "pune", country: "india", count: 5 },
  { city: "ahmedabad", country: "india", count: 4 },
  { city: "indore", country: "india", count: 3 },
  { city: "jaipur", country: "india", count: 3 },

  // East & North India
  { city: "kolkata", country: "india", count: 4 },
  { city: "lucknow", country: "india", count: 3 },
  { city: "chandigarh", country: "india", count: 3 },
  { city: "amritsar", country: "india", count: 2 },
  { city: "guwahati", country: "india", count: 2 },
];

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const EMAIL_PREFIX = "stress_india_alumni_";

    if (isCleanMode) {
      console.log("\n🧹 Cleaning up stress-test Indian alumni...");
      const users = await User.find({ email: new RegExp(`^${EMAIL_PREFIX}`) });
      const userIds = users.map((u) => u._id);

      await Profile.deleteMany({ user: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });

      console.log(`Deleted ${userIds.length} test users & profiles.`);
      await invalidateAlumniMapCache();
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log("\n🌱 Seeding 100+ Indian Alumni profiles across 20+ city/alias variants...\n");

    const hashedPassword = await bcrypt.hash("12345678", 10);
    let totalCreated = 0;
    let globalIdx = 1;

    for (const citySpec of STRESS_CITIES) {
      const norm = normalizeCityAndCountry(citySpec.city, citySpec.country);
      const canonical = CANONICAL_CITIES[norm.canonicalKey];

      for (let i = 0; i < citySpec.count; i++) {
        const email = `${EMAIL_PREFIX}${globalIdx}@nsut.ac.in`;
        globalIdx++;

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: `Indian Alum ${globalIdx} (${citySpec.city})`,
            email,
            password: hashedPassword,
            role: "alumni",
            email_verified: true,
            email_verified_at: new Date(),
            profileCompleted: true,
            verified_alumni: true,
            authProvider: "local",
          });
        }

        // Add slight random coordinate jitter (+/- 0.01 deg ~ 1km) to simulate realistic real-world coords
        const jitterLat = (Math.random() - 0.5) * 0.02;
        const jitterLng = (Math.random() - 0.5) * 0.02;

        const baseLat = canonical ? canonical.lat : 28.6139;
        const baseLng = canonical ? canonical.lng : 77.209;

        const finalLat = Number((baseLat + jitterLat).toFixed(6));
        const finalLng = Number((baseLng + jitterLng).toFixed(6));

        await Profile.findOneAndUpdate(
          { user: user._id },
          {
            user: user._id,
            batch: "2021",
            branch: "Computer Science Engineering",
            campus: "Main Campus",
            location: {
              city: citySpec.city.toLowerCase(),
              country: citySpec.country.toLowerCase(),
              lat: finalLat,
              lng: finalLng,
            },
          },
          { upsert: true, new: true }
        );

        totalCreated++;
      }

      console.log(`✅ Seeded ${citySpec.count} alumni for '${citySpec.city}' -> resolves to '${norm.displayCity}'`);
    }

    console.log(`\n✨ Seeding complete: ${totalCreated} Indian alumni active across map.`);
    await invalidateAlumniMapCache();
    console.log("Cleared Redis alumni-map cache.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

run();
