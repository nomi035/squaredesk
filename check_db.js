const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.database_url,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
  console.log("Tables:", res.rows);
  
  const res2 = await client.query('SELECT id, "firstName", "shiftId" FROM "user" LIMIT 5;');
  console.log("Users:", res2.rows);

  const res3 = await client.query('SELECT * FROM "shift";');
  console.log("Shifts:", res3.rows);

  await client.end();
}
run();
