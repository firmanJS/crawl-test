const { pool } = require('../config/db');
const { objectToArray } = require('../utils');

const createProduct = async (request) => {
  try {
    const payloads = objectToArray(request.payload);
    const text = `
      INSERT INTO product
      (name, image, description, price, stock, sku) 
      VALUES($1, $2, $3, $4, $5, $6) RETURNING *`;
    const res = await pool.query(text, payloads);
    return res.rows[0];
  } catch (err) {
    return err.toString();
  }
};

const getProduct = async (request) => {
  try {
    const page = request?.query?.page || 1;
    const limit = request?.query?.limit || 10;
    const offset = (limit * page) - limit;
    const text = `
      SELECT name, sku, image, price, stock from product OFFSET ${offset} LIMIT ${limit}`;
    const res = await pool.query(text);
    return {
      data: res.rows,
    };
  } catch (err) {
    return err.toString();
  }
};

const getProductBy = async (request) => {
  try {
    const text = `
      SELECT name, sku, image, price, stock, description from product
      WHERE sku='${request.params.sku}'
    `;
    const res = await pool.query(text);
    return {
      data: res.rows[0],
    };
  } catch (err) {
    return err.toString();
  }
};

const updateProduct = async (request) => {
  try {
    const payloads = objectToArray(request.payload);
    const text = `
      UPDATE product SET name=$1, image=$2, description=$3, price=$4, stock=$5
      WHERE sku='${request.params.sku}' RETURNING *`;
    const res = await pool.query(text, payloads);
    if (res.rows[0]) {
      return res.rows[0];
    }
    return res.rows;
  } catch (err) {
    return err.toString();
  }
};

const deleteProduct = async (request) => {
  try {
    const text = `DELETE from product WHERE sku='${request.params.sku}'`;
    const textTransaction = `DELETE from adjustment_transaction WHERE sku='${request.params.sku}'`;
    const res = await pool.query(text);
    await pool.query(textTransaction);
    return { message: res.rowCount };
  } catch (err) {
    return err.toString();
  }
};

module.exports = {
  createProduct, getProduct, getProductBy, updateProduct, deleteProduct,
};
