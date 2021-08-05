const { pool } = require('../config/db');
const { objectToArray } = require('../utils');

const createTransaction = async (request) => {
  try {
    let result;
    const { sku, qty } = request.payload;
    // check product
    const textProduct = `SELECT price, stock from product WHERE sku='${sku}'`;
    const checkStock = await pool.query(textProduct);
    if (checkStock.rowCount === 0) {
      return { message: 'product not found' };
    }
    if (+checkStock.rows[0].stock === 0) {
      result = { message: 'stock is 0 please update the stock product' };
    } else {
      request.payload.amount = checkStock.rows[0].price * qty;

      // updated product stock
      const textUdateStockProduct = `UPDATE product SET stock=$1 WHERE sku='${sku}'`;
      const updateStock = checkStock.rows[0].stock - qty;
      await pool.query(textUdateStockProduct, [updateStock]);
      const payloads = objectToArray(request.payload);
      const text = `
          INSERT INTO adjustment_transaction
          (sku, qty, amount) 
          VALUES($1, $2, $3) RETURNING *`;
      const res = await pool.query(text, payloads);
      // eslint-disable-next-line prefer-destructuring
      result = res.rows[0];
    }
    return result;
  } catch (err) {
    return err.toString();
  }
};

const getTransaction = async (request) => {
  try {
    const page = request?.query?.page || 1;
    const limit = request?.query?.limit || 10;
    const offset = (limit * page) - limit;
    const text = `
      SELECT sku, qty, amount from adjustment_transaction OFFSET 
      ${offset} LIMIT ${limit}
    `;
    const res = await pool.query(text);
    return {
      data: res.rows,
    };
  } catch (err) {
    return err.toString();
  }
};

const getTransactionBy = async (request) => {
  try {
    const text = `
      SELECT sku, qty, amount from adjustment_transaction
      WHERE sku='${request.params.sku}'
    `;
    const res = await pool.query(text);
    return {
      data: res.rows,
    };
  } catch (err) {
    return err.toString();
  }
};

const updateTransaction = async (request) => {
  try {
    const payloads = objectToArray(request.payload);
    const text = `
      UPDATE adjustment_transaction SET sku=$1, qty=$2 WHERE sku='${request.params.sku}' RETURNING *`;
    const res = await pool.query(text, payloads);
    if (res.rows[0]) {
      return res.rows[0];
    }
    return res.rows;
  } catch (err) {
    return err.toString();
  }
};

const deleteTransaction = async (request) => {
  try {
    const { sku } = request.params;
    // sum of qty adjustment_transaction by sku
    const textSum = `SELECT sum(qty) as total from adjustment_transaction WHERE sku='${sku}'`;
    const sumQty = await pool.query(textSum);

    // get last stokc in product
    const textProduct = `SELECT stock from product WHERE sku='${sku}'`;
    const lastStock = await pool.query(textProduct);
    if (lastStock.rowCount === 0) {
      return { message: 'product not found' };
    }
    // restore product stokck if adjustment_transaction deleted
    const textUdateStockProduct = `UPDATE product SET stock=$1 WHERE sku='${sku}'`;
    const updateStock = +sumQty.rows[0].total + +lastStock.rows[0].stock;
    await pool.query(textUdateStockProduct, [updateStock]);

    // delete adjustment_transaction
    const text = `DELETE from adjustment_transaction WHERE sku='${sku}'`;
    const res = await pool.query(text);
    return { message: res.rowCount };
  } catch (err) {
    return err.toString();
  }
};

module.exports = {
  createTransaction, getTransaction, getTransactionBy, updateTransaction, deleteTransaction,
};
