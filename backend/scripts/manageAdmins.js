/**
 * Interactive script to create/manage admin users
 * Run: node scripts/manageAdmins.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');
const User = require('../models/user/user.model');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Database connection
const connectDB = async () => {
  try {
    // Use the same logic as database.config.js
    const mongoUri = process.env.NODE_ENV !== 'production'
      ? process.env.MONGODB_URI_DEV
      : process.env.MONGODB_URI_PROD;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found. Check MONGODB_URI_DEV or MONGODB_URI_PROD in .env');
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// List all admins
const listAdmins = async () => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    
    if (admins.length === 0) {
      console.log('📭 No admin users found.\n');
      return;
    }

    console.log(`\n📋 Found ${admins.length} admin user(s):\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🆔 ID: ${admin._id}`);
      console.log(`   ✅ Verified: ${admin.email_verified}`);
      console.log(`   🚫 Banned: ${admin.banned}`);
      console.log(`   📅 Created: ${admin.createdAt?.toLocaleDateString() || 'N/A'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error listing admins:', error.message);
  }
};

// Create new admin
const createAdmin = async () => {
  try {
    console.log('\n📝 Create New Admin User\n');
    
    const name = await question('Enter admin name: ');
    if (!name.trim()) {
      console.log('❌ Name cannot be empty');
      return;
    }

    const email = await question('Enter admin email: ');
    if (!email.trim() || !email.includes('@')) {
      console.log('❌ Invalid email format');
      return;
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log(`❌ User with email ${email} already exists!`);
      if (existing.role !== 'admin') {
        const promote = await question('This user exists but is not an admin. Promote to admin? (yes/no): ');
        if (promote.toLowerCase() === 'yes' || promote.toLowerCase() === 'y') {
          existing.role = 'admin';
          existing.email_verified = true;
          existing.profileCompleted = true;
          await existing.save();
          console.log('✅ User promoted to admin successfully!');
        }
      }
      return;
    }

    const password = await question('Enter admin password (min 8 characters): ');
    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters');
      return;
    }

    console.log('\n⏳ Creating admin user...');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      email_verified: true,
      profileCompleted: true,
      verified_alumni: false,
      banned: false,
      authProvider: 'local',
    });

    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🎭 Role: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Login at /login to access the admin panel\n');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
};

// Delete admin
const deleteAdmin = async () => {
  try {
    await listAdmins();
    
    const email = await question('\nEnter email of admin to delete (or "cancel" to abort): ');
    if (email.toLowerCase() === 'cancel') {
      console.log('❌ Deletion cancelled\n');
      return;
    }

    const admin = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found with that email\n');
      return;
    }

    const confirm = await question(`⚠️  Are you sure you want to delete admin "${admin.name}" (${admin.email})? (yes/no): `);
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Deletion cancelled\n');
      return;
    }

    await User.deleteOne({ _id: admin._id });
    console.log('✅ Admin user deleted successfully\n');
    
  } catch (error) {
    console.error('❌ Error deleting admin:', error.message);
  }
};

// Change admin password
const changePassword = async () => {
  try {
    await listAdmins();
    
    const email = await question('\nEnter email of admin to update password (or "cancel" to abort): ');
    if (email.toLowerCase() === 'cancel') {
      console.log('❌ Operation cancelled\n');
      return;
    }

    const admin = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found with that email\n');
      return;
    }

    const newPassword = await question('Enter new password (min 8 characters): ');
    if (newPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters');
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Password updated successfully\n');
    
  } catch (error) {
    console.error('❌ Error changing password:', error.message);
  }
};

// Show menu
const showMenu = () => {
  console.log('\n🔧 Admin Management Menu');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. List all admins');
  console.log('2. Create new admin');
  console.log('3. Delete admin');
  console.log('4. Change admin password');
  console.log('5. Exit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

// Main menu loop
const main = async () => {
  console.log('🚀 NSUT Alumni Admin Management');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  await connectDB();

  let running = true;
  while (running) {
    showMenu();
    const choice = await question('Enter your choice (1-5): ');

    switch (choice) {
      case '1':
        await listAdmins();
        break;
      case '2':
        await createAdmin();
        break;
      case '3':
        await deleteAdmin();
        break;
      case '4':
        await changePassword();
        break;
      case '5':
        console.log('\n👋 Goodbye!\n');
        running = false;
        break;
      default:
        console.log('❌ Invalid choice. Please enter 1-5\n');
    }
  }

  rl.close();
  process.exit(0);
};

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  rl.close();
  process.exit(1);
});
