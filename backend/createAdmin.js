const bcrypt = require('bcryptjs');
require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');

const createAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to MySQL database.');

        // Sync model (won't drop existing tables)
        await User.sync({ alter: false });

        const adminEmail = 'admin@shubhamacrylic.com';
        const adminUsername = 'admin';
        const adminPassword = 'p@sswor1';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Check if admin already exists
        let adminUser = await User.findOne({ where: { email: adminEmail } });

        if (!adminUser) {
            adminUser = await User.create({
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword,
                isMaster: true,
            });
            console.log(`✅ Admin user created successfully!`);
        } else {
            await adminUser.update({ password: hashedPassword, isMaster: true });
            console.log(`✅ Admin user already existed — password + isMaster updated.`);
        }

        console.log(`   Email   : ${adminEmail}`);
        console.log(`   Username: ${adminUsername}`);
        console.log(`   Password: ${adminPassword}`);

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createAdmin();
