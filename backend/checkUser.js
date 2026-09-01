const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const checkAndSeedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log('Existing users in DB:', users.map(u => ({ username: u.username, email: u.email })));

        // Create default admin user if not exists or reset password
        const adminEmail = 'admin@shubhamtees.com';
        const adminPassword = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        let adminUser = await User.findOne({ email: adminEmail });
        if (!adminUser) {
            adminUser = new User({
                username: 'Admin',
                email: adminEmail,
                password: hashedPassword
            });
            await adminUser.save();
            console.log(`Created admin user: ${adminEmail} with password: ${adminPassword}`);
        } else {
            adminUser.password = hashedPassword;
            await adminUser.save();
            console.log(`Updated password for admin user: ${adminEmail} to ${adminPassword}`);
        }

        // Also ensure admin@acrylia.com works if existing
        let oldAdmin = await User.findOne({ email: 'admin@acrylia.com' });
        if (oldAdmin) {
            oldAdmin.password = hashedPassword;
            await oldAdmin.save();
            console.log(`Updated password for admin@acrylia.com to ${adminPassword}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking/seeding admin:', error);
        process.exit(1);
    }
};

checkAndSeedAdmin();
