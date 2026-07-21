/**
 * Users collection — seed data and loader.
 * Alumni data/emails sourced from the existing scripts/fixDatabaseEntries.js.
 * Student and admin data authored fresh (no prior file had this pattern).
 */

const bcrypt = require('bcrypt');
const User = require('../../models/user/user.model');

const PASSWORD = '12345678';

const alumniData = [
  { name: 'Rahul Kumar', email: 'alumni1@gmail.com', batch: '2020', branch: 'Computer Science Engineering', campus: 'Main Campus' },
  { name: 'Rahul Kumar', email: 'alumni2@gmail.com', batch: '2020', branch: 'Computer Science Engineering', campus: 'Main Campus' },
  { name: 'Priya Sharma', email: 'alumni3@gmail.com', batch: '2021', branch: 'Electrical Engineering', campus: 'Main Campus' },
  { name: 'Priya Sharma', email: 'alumni4@gmail.com', batch: '2021', branch: 'Mechanical Engineering', campus: 'Main Campus' },
  { name: 'Amit Patel', email: 'alumni5@gmail.com', batch: '2019', branch: 'Computer Science Engineering', campus: 'Main Campus' },
  { name: 'Sneha Reddy', email: 'alumni6@gmail.com', batch: '2020', branch: 'Electrical Engineering', campus: 'Main Campus' },
  { name: 'Vikram Singh', email: 'alumni7@gmail.com', batch: '2018', branch: 'Mechanical Engineering', campus: 'Main Campus' },
  { name: 'Ananya Iyer', email: 'alumni8@gmail.com', batch: '2021', branch: 'Computer Science Engineering', campus: 'Main Campus' },
  { name: 'Rohit Verma', email: 'alumni9@gmail.com', batch: '2019', branch: 'Electronics and Communication Engineering', campus: 'Main Campus' },
  { name: 'Neha Gupta', email: 'alumni10@gmail.com', batch: '2022', branch: 'Computer Science Engineering', campus: 'Main Campus' },
];

const studentData = [
  { name: 'Aarav Sharma', email: 's1@nsut.ac.in', batch: '2026', branch: 'Computer Science Engineering', campus: 'Main Campus' },
  { name: 'Ishita Verma', email: 's2@nsut.ac.in', batch: '2026', branch: 'Electronics and Communication Engineering', campus: 'Main Campus' },
  { name: 'Kabir Mehta', email: 's3@nsut.ac.in', batch: '2027', branch: 'Mechanical Engineering', campus: 'Main Campus' },
  { name: 'Ananya Joshi', email: 's4@nsut.ac.in', batch: '2027', branch: 'Electrical Engineering', campus: 'East Campus' },
  { name: 'Rohan Nair', email: 's5@nsut.ac.in', batch: '2025', branch: 'Computer Science Engineering', campus: 'Main Campus' },
  { name: 'Diya Kapoor', email: 's6@nsut.ac.in', batch: '2028', branch: 'Information Technology', campus: 'West Campus' },
  { name: 'Arjun Reddy', email: 's7@nsut.ac.in', batch: '2026', branch: 'Mechanical Engineering', campus: 'Main Campus' },
  { name: 'Sanya Malhotra', email: 's8@nsut.ac.in', batch: '2027', branch: 'Computer Science Engineering', campus: 'Main Campus' },
  { name: 'Vivaan Gupta', email: 's9@nsut.ac.in', batch: '2025', branch: 'Electronics and Communication Engineering', campus: 'East Campus' },
  { name: 'Myra Singh', email: 's10@nsut.ac.in', batch: '2028', branch: 'Electrical Engineering', campus: 'Main Campus' },
];

const adminData = { name: 'Dev Admin', email: 'devadmin@nsut.ac.in' };

async function seedUsers() {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  for (const a of alumniData) {
    const existing = await User.findOne({ email: a.email });
    if (existing) {
      console.log(`⚠️  ${a.email} already exists, skipping`);
      continue;
    }
    await User.create({
      name: a.name,
      email: a.email,
      password: hashedPassword,
      role: 'alumni',
      email_verified: true,
      email_verified_at: new Date(),
      profileCompleted: true,
      verified_alumni: true,
    });
    console.log(`✅ alumni: ${a.name} (${a.email})`);
  }

  for (const s of studentData) {
    const existing = await User.findOne({ email: s.email });
    if (existing) {
      console.log(`⚠️  ${s.email} already exists, skipping`);
      continue;
    }
    await User.create({
      name: s.name,
      email: s.email,
      password: hashedPassword,
      role: 'student',
      email_verified: true,
      // Required, not just email_verified — isStudentVerificationExpired()
      // (user.model.js:83-91) treats a null email_verified_at as expired and
      // blocks sign-in even when email_verified is true.
      email_verified_at: new Date(),
      profileCompleted: true,
    });
    console.log(`✅ student: ${s.name} (${s.email})`);
  }

  const existingAdmin = await User.findOne({ email: adminData.email });
  if (existingAdmin) {
    console.log(`⚠️  ${adminData.email} already exists, skipping`);
  } else {
    await User.create({
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: 'admin',
      email_verified: true,
      email_verified_at: new Date(),
      profileCompleted: true,
    });
    console.log(`✅ admin: ${adminData.name} (${adminData.email})`);
  }
}

module.exports = { seedUsers, alumniData, studentData, adminData, PASSWORD };
