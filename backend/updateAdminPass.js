const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const updateAllAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await User.updateMany({}, { password: hashedPassword });
        console.log('Successfully set password for all admin accounts to: admin123');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

updateAllAdmins();
