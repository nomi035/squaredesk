const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.database_url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('TRUNCATE TABLE "payroll" CASCADE;');
    console.log("Payroll wiped:", res);
  } catch (err) {
    console.error("Error:", err.message);
    try {
        const res2 = await client.query('TRUNCATE TABLE "Payroll" CASCADE;');
        console.log("Payroll wiped:", res2);
    } catch(err2) {
        console.error("Error 2:", err2.message);
    }
  } finally {
    await client.end();
  }
}
run();
