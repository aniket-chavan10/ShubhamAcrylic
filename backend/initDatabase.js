const mysql = require('mysql2/promise');
require('dotenv').config();

const initDb = async () => {
  try {
    const dbName = process.env.DB_NAME || 'shubham_tshirts';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '123456';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = parseInt(process.env.DB_PORT) || 3306;

    console.log(`Connecting to MySQL server at ${dbHost}:${dbPort} as ${dbUser}...`);
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
    });

    console.log(`Creating database "${dbName}" if it does not exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database "${dbName}" is ready.`);

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  }
};

initDb();
