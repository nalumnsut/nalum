/**
 * Postgres `alumni` table — seed data and loader.
 * Schema matches the real Neon production table exactly (pulled and verified
 * this session): id serial PK, full_name text, passing_year integer,
 * degree text, branch text, roll_no text.
 *
 * Generates 1,000 deterministic fake alumni records spanning 1980-2020
 * across 8 NSUT branches, with roll numbers in the real
 * <seq>/<branch-code>/<yy> format. Deterministic (same 1,000 roll_no values
 * every run) so the per-row existence check below is a safe, idempotent
 * re-run — same as the Mongo seed files.
 */

const { pool } = require('../../config/postgres');

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna',
  'Ishaan', 'Rohan', 'Kabir', 'Karan', 'Rahul', 'Amit', 'Vikram', 'Rohit',
  'Nikhil', 'Manish', 'Anil', 'Sanjay', 'Ananya', 'Diya', 'Ishita', 'Myra',
  'Sanya', 'Priya', 'Sneha', 'Neha', 'Pooja', 'Anjali', 'Kavya', 'Riya',
  'Aisha', 'Meera', 'Divya', 'Shreya', 'Nisha', 'Ritu', 'Deepika', 'Suresh',
  'Rajesh', 'Ramesh', 'Ajay', 'Vijay', 'Sunil',
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Kapoor', 'Malhotra', 'Mehta', 'Singh', 'Reddy',
  'Iyer', 'Patel', 'Kumar', 'Nair', 'Rao', 'Chopra', 'Bose', 'Das', 'Joshi',
  'Agarwal', 'Bansal', 'Saxena', 'Mishra', 'Pandey', 'Tiwari', 'Yadav',
  'Chauhan', 'Rathore', 'Bhatt', 'Trivedi', 'Desai', 'Shah', 'Menon',
  'Pillai', 'Krishnan', 'Subramaniam', 'Ghosh', 'Chatterjee', 'Banerjee',
  'Mukherjee', 'Sen', 'Dutta', 'Kaur', 'Gill', 'Sandhu', 'Arora', 'Khanna',
];

const branches = [
  { name: 'Computer Engineering', code: 'COE' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Electronics and Communication Engineering', code: 'ECE' },
  { name: 'Electrical Engineering', code: 'ELE' },
  { name: 'Mechanical Engineering', code: 'MAE' },
  { name: 'Civil Engineering', code: 'CE' },
  { name: 'Instrumentation and Control Engineering', code: 'ICE' },
  { name: 'Biotechnology', code: 'BT' },
];

const DEGREE = 'Bachelors Of Technology';
const TOTAL = 1000;
const START_YEAR = 1980;
const END_YEAR = 2020;

function buildAlumniData() {
  const years = [];
  for (let y = START_YEAR; y <= END_YEAR; y++) years.push(y);

  const seqByGroup = {}; // key: "<year>-<branchCode>" -> running sequence number
  const rows = [];

  for (let i = 0; i < TOTAL; i++) {
    const branch = branches[i % branches.length];
    const year = years[Math.floor(i / branches.length) % years.length];

    const groupKey = `${year}-${branch.code}`;
    seqByGroup[groupKey] = (seqByGroup[groupKey] || 0) + 1;
    const seq = seqByGroup[groupKey];

    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 13) % lastNames.length];
    const yy = String(year % 100).padStart(2, '0');

    rows.push({
      full_name: `${firstName} ${lastName}`,
      passing_year: year,
      degree: DEGREE,
      branch: branch.name,
      roll_no: `${seq}/${branch.code}/${yy}`,
    });
  }

  return rows;
}

async function seedAlumniPg() {
  if (!pool) {
    console.log('⚠️  Postgres not configured (POSTGRESQL_DATABASE_URL unset) — skipping alumni table seed.');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS alumni (
      id SERIAL PRIMARY KEY,
      full_name TEXT,
      passing_year INTEGER,
      degree TEXT,
      branch TEXT,
      roll_no TEXT
    )
  `);

  const rows = buildAlumniData();

  const existing = await pool.query('SELECT roll_no FROM alumni');
  const existingRollNos = new Set(existing.rows.map((r) => r.roll_no));

  const toInsert = rows.filter((r) => !existingRollNos.has(r.roll_no));

  if (toInsert.length === 0) {
    console.log(`⚠️  all ${rows.length} alumni rows already exist, skipping`);
    return;
  }

  const values = [];
  const placeholders = toInsert.map((r, idx) => {
    const base = idx * 5;
    values.push(r.full_name, r.passing_year, r.degree, r.branch, r.roll_no);
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
  });

  await pool.query(
    `INSERT INTO alumni (full_name, passing_year, degree, branch, roll_no) VALUES ${placeholders.join(', ')}`,
    values
  );

  console.log(`✅ alumni (Postgres): inserted ${toInsert.length}, skipped ${rows.length - toInsert.length} already present`);
}

module.exports = { seedAlumniPg, buildAlumniData };
