/**
 * Connections collection — seed data and loader.
 * Depends on users.js having already run (looks requester/recipient up by email).
 */

const User = require('../../models/user/user.model');
const Connection = require('../../models/chat/connections.model');

const connectionsData = [
  { requesterEmail: 'alumni1@gmail.com', recipientEmail: 'alumni2@gmail.com', status: 'accepted' },
  { requesterEmail: 'alumni3@gmail.com', recipientEmail: 'alumni4@gmail.com', status: 'pending' },
  { requesterEmail: 's1@nsut.ac.in', recipientEmail: 'alumni1@gmail.com', status: 'accepted' },
];

async function seedConnections() {
  for (const c of connectionsData) {
    const requester = await User.findOne({ email: c.requesterEmail });
    const recipient = await User.findOne({ email: c.recipientEmail });
    if (!requester || !recipient) {
      console.log(`⚠️  missing user for connection ${c.requesterEmail} -> ${c.recipientEmail}, skipping`);
      continue;
    }
    const existing = await Connection.findOne({ requester: requester._id, recipient: recipient._id });
    if (existing) {
      console.log(`⚠️  connection ${c.requesterEmail} -> ${c.recipientEmail} already exists, skipping`);
      continue;
    }
    await Connection.create({
      requester: requester._id,
      recipient: recipient._id,
      status: c.status,
      respondedAt: c.status !== 'pending' ? new Date() : null,
    });
    console.log(`✅ connection: ${c.requesterEmail} -> ${c.recipientEmail} (${c.status})`);
  }
}

module.exports = { seedConnections, connectionsData };
