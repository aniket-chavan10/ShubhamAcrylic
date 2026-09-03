require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');

const seedAdmins = async () => {
  try {
    await sequelize.authenticate();

    const pass1 = await bcrypt.hash('p@sswor1', 10);
    const pass2 = await bcrypt.hash('admin123', 10);

    // 1. admin@shubhamacrylic.com (Username: admin) -> password: p@sswor1
    let admin1 = await User.findOne({ where: { email: 'admin@shubhamacrylic.com' } });
    if (admin1) {
      await admin1.update({ password: pass1, isMaster: true });
    } else {
      await User.create({ username: 'admin', email: 'admin@shubhamacrylic.com', password: pass1, isMaster: true });
    }

    // 2. admin@shubhamtees.com (Username: admin_tees) -> password: admin123
    let admin2 = await User.findOne({ where: { email: 'admin@shubhamtees.com' } });
    if (admin2) {
      await admin2.update({ password: pass2, isMaster: true });
    } else {
      await User.create({ username: 'shubhamtees', email: 'admin@shubhamtees.com', password: pass2, isMaster: true });
    }

    console.log('✅ Admin credentials updated in MySQL DB successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admins:', err);
    process.exit(1);
  }
};

seedAdmins();
