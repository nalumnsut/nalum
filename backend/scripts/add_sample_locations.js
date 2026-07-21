const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error(".env file not found at", envPath);
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in environment variables");
  process.exit(1);
}

// Sample locations with proper coordinates
const sampleLocations = [
  { city: "delhi", country: "india", lat: 28.6139, lng: 77.209 },
  { city: "mumbai", country: "india", lat: 19.076, lng: 72.8777 },
  { city: "bangalore", country: "india", lat: 12.9716, lng: 77.5946 },
  { city: "pune", country: "india", lat: 18.5204, lng: 73.8567 },
  { city: "hyderabad", country: "india", lat: 17.385, lng: 78.4867 },
  { city: "chennai", country: "india", lat: 13.0827, lng: 80.2707 },
  { city: "kolkata", country: "india", lat: 22.5726, lng: 88.3639 },
  { city: "ahmedabad", country: "india", lat: 23.0225, lng: 72.5714 },
  { city: "new york", country: "united states", lat: 40.7128, lng: -74.006 },
  { city: "london", country: "united kingdom", lat: 51.5074, lng: -0.1278 },
  { city: "singapore", country: "singapore", lat: 1.3521, lng: 103.8198 },
  { city: "dubai", country: "united arab emirates", lat: 25.2048, lng: 55.2708 },
];

async function addSampleLocations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Access raw collection
    const db = mongoose.connection.db;
    const profilesCollection = db.collection("profiles");

    // Find profiles without location field
    const profilesWithoutLocation = await profilesCollection
      .find({
        $or: [
          { location: { $exists: false } },
          { location: null },
          { "location.city": { $exists: false } },
          { "location.city": "" },
        ],
      })
      .toArray();

    console.log(
      `\nFound ${profilesWithoutLocation.length} profiles without location data.\n`,
    );

    if (profilesWithoutLocation.length === 0) {
      console.log("✅ All profiles already have location data!");
      await mongoose.connection.close();
      return;
    }

    let updateCount = 0;

    for (let i = 0; i < profilesWithoutLocation.length; i++) {
      const profile = profilesWithoutLocation[i];
      const locationData = sampleLocations[i % sampleLocations.length];

      await profilesCollection.updateOne(
        { _id: profile._id },
        {
          $set: {
            location: {
              city: locationData.city,
              country: locationData.country,
              lat: locationData.lat,
              lng: locationData.lng,
            },
          },
        },
      );

      console.log(`✅ Updated Profile ID: ${profile._id}`);
      console.log(`   Location: ${locationData.city}, ${locationData.country}`);
      console.log(
        `   Coordinates: lat=${locationData.lat}, lng=${locationData.lng}\n`,
      );
      updateCount++;
    }

    console.log("\n=== UPDATE COMPLETE ===");
    console.log(`✅ Successfully updated: ${updateCount} profiles`);

    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
  } catch (error) {
    console.error("Error during update:", error);
    process.exit(1);
  }
}

addSampleLocations();
