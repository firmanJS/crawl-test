/* eslint-disable no-console */
const { Pool } = require('pg');

const pool = new Pool({
  user: 'fimz',
  host: 'localhost',
  database: 'postgres',
  password: 'fimz',
  port: 5432,
});

pool.on('error', (err) => err);

pool.on('connect', (err) => err);

module.exports = { pool };
