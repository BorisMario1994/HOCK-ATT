const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
};

const pool = new sql.ConnectionPool(dbConfig);
const connectDB = async () => {
  try {
    await pool.connect();
    console.log("SQL Server connected");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
};

module.exports = { pool, connectDB };
