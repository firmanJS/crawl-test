/* eslint-disable no-console */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PG_USERNAME,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
});

pool.on('error', (err) => ({
  message: err.toString(),
}));

pool.on('connect', (err) => ({
  message: err.toString(),
}));

module.exports = { pool };
