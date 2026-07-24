/**
 * Events collection — seed data and loader.
 * Depends on users.js having already run (looks the creator up by email).
 * Basic set, adapted from the sample data in the old scripts/createEvent.js.
 */

const User = require('../../models/user/user.model');
const Event = require('../../models/admin/event.model');

const eventsData = [
  {
    title: 'Tech Innovation Workshop',
    description: 'A workshop covering the latest in AI, ML, and cloud computing.',
    event_date: new Date('2026-09-15'),
    event_time: '10:00 AM',
    location: 'Main Campus Auditorium',
    event_type: 'workshop',
    status: 'approved',
    creatorEmail: 'alumni1@gmail.com',
  },
  {
    title: 'Alumni Networking Meetup',
    description: 'Connect with fellow alumni and build professional relationships.',
    event_date: new Date('2026-10-05'),
    event_time: '6:00 PM',
    location: 'City Convention Center',
    event_type: 'meetup',
    status: 'approved',
    creatorEmail: 'alumni2@gmail.com',
  },
  {
    title: 'Career Guidance Webinar',
    description: 'Resume building and interview prep from alumni working in the industry.',
    event_date: new Date('2026-11-01'),
    event_time: '5:00 PM',
    location: 'Online - Zoom',
    event_type: 'webinar',
    status: 'pending',
    creatorEmail: 'alumni3@gmail.com',
  },
];

async function seedEvents() {
  for (const e of eventsData) {
    const existing = await Event.findOne({ title: e.title });
    if (existing) {
      console.log(`⚠️  event "${e.title}" already exists, skipping`);
      continue;
    }
    const creator = await User.findOne({ email: e.creatorEmail });
    if (!creator) {
      console.log(`⚠️  creator ${e.creatorEmail} not found, skipping event "${e.title}"`);
      continue;
    }
    await Event.create({
      title: e.title,
      description: e.description,
      event_date: e.event_date,
      event_time: e.event_time,
      location: e.location,
      event_type: e.event_type,
      status: e.status,
      created_by: creator._id,
      creator_name: creator.name,
      creator_email: creator.email,
    });
    console.log(`✅ event: ${e.title}`);
  }
}

module.exports = { seedEvents, eventsData };
