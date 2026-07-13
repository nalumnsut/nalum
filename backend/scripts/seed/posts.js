/**
 * Posts collection — seed data and loader.
 * Depends on users.js having already run (looks the author up by email).
 */

const User = require('../../models/user/user.model');
const Post = require('../../models/posts/post.model');

const postsData = [
  {
    title: 'My journey after graduation',
    content: 'Sharing a few things I learned in my first year at work — it was a big shift from campus life, but a great one.',
    authorEmail: 'alumni1@gmail.com',
  },
  {
    title: 'Tips for campus placements',
    content: 'A few things that helped me crack interviews: mock interviews, DSA practice, and talking to seniors who\'d already been through it.',
    authorEmail: 'alumni4@gmail.com',
  },
  {
    title: 'Excited for the new semester!',
    content: 'Looking forward to a great year ahead, and hoping to connect with more alumni through this platform.',
    authorEmail: 's1@nsut.ac.in',
  },
];

async function seedPosts() {
  for (const p of postsData) {
    const existing = await Post.findOne({ title: p.title });
    if (existing) {
      console.log(`⚠️  post "${p.title}" already exists, skipping`);
      continue;
    }
    const author = await User.findOne({ email: p.authorEmail });
    if (!author) {
      console.log(`⚠️  author ${p.authorEmail} not found, skipping post "${p.title}"`);
      continue;
    }
    await Post.create({
      title: p.title,
      content: p.content,
      userId: author._id,
      status: 'approved',
    });
    console.log(`✅ post: ${p.title}`);
  }
}

module.exports = { seedPosts, postsData };
