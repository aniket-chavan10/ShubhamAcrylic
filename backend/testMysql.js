const { Sequelize } = require('sequelize');

const testPasswords = ['', 'root', 'admin', '123456', 'root123', 'p@ssword', 'password', 'PZsMza7OfryNwPjJ', 'admin123'];

const testConnection = async () => {
    for (const pass of testPasswords) {
        console.log(`Testing root with password: "${pass}"...`);
        const seq = new Sequelize('mysql', 'root', pass, {
            host: 'localhost',
            port: 3306,
            dialect: 'mysql',
            logging: false,
        });

        try {
            await seq.authenticate();
            console.log(`✅ SUCCESS! Working MySQL password is: "${pass}"`);
            await seq.close();
            process.exit(0);
        } catch (err) {
            console.log(`❌ Password "${pass}" failed: ${err.message}`);
        }
    }
    console.log('All common passwords failed.');
    process.exit(1);
};

testConnection();
