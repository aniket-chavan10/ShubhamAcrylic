require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');

const checkUsers = async () => {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({ raw: true });
    console.log('All Users in MySQL DB:');
    users.forEach(u => console.log(`- ID: ${u.id}, Username: "${u.username}", Email: "${u.email}", isMaster: ${u.isMaster}`));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching users:', err);
    process.exit(1);
  }
};

checkUsers();
