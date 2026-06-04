const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.fazjuxxbuagatfebupya:Atinuke%40rop1@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require',
});
client.connect()
  .then(() => {
    console.log('Connected!');
    return client.query('SELECT 1');
  })
  .then(res => {
    console.log('Result:', res.rows);
    client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
    client.end();
  });
