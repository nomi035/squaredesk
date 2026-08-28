const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.database_url,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  const res2 = await client.query('SELECT id, "firstName", "shiftId" FROM "User" WHERE "shiftId" IS NOT NULL;');
  console.log("Users with shifts:", res2.rows);

  await client.end();
}
run();
