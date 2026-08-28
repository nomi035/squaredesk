const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.database_url,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query('SELECT * FROM "Shift";');
  console.log("Shifts:", res.rows);
  
  const res2 = await client.query('SELECT id, "firstName", "shiftId" FROM "User" LIMIT 5;');
  console.log("Users:", res2.rows);
  await client.end();
}
run();
