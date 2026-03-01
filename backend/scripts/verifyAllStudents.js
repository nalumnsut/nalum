/**
 * Verify All Students
 * 
 * Sets email_verified=true and email_verified_at=now for all students.
 * Useful when you need to bulk-verify students (e.g., after onboarding).
 * 
 * Usage: node scripts/verifyAllStudents.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user/user.model");

async function verifyAllStudents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const result = await User.updateMany(
            { role: "student" },
            { $set: { email_verified: true, email_verified_at: new Date() } }
        );

        console.log(
            `✅ Students verified: ${result.modifiedCount} out of ${result.matchedCount} total students`
        );
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

verifyAllStudents();
