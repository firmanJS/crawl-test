const { pool } = require('../config/db');
const { objectToArray } = require('../utils');

const updateStok = async (stock, sku, qty) => {
  // updated product stock
  const textUdateStockProduct = `UPDATE product SET stock=$1 WHERE sku='${sku}'`;
  const updateStock = stock - qty;
  await pool.query(textUdateStockProduct, [updateStock]);
};

const checkStokProduct = async (sku) => {
  // check product stock
  const textProduct = `SELECT price, stock from product WHERE sku='${sku}'`;
  const checkStock = await pool.query(textProduct);

  return checkStock;
};

const calculateAmount = (request, checkStock, qty) => {
  request.payload.amount = checkStock.rows[0].price * qty;

  return request;
};

const createTransaction = async (request) => {
  try {
    let result;
    const { sku, qty } = request.payload;
    // check product
    const checkStock = await checkStokProduct(sku);
    if (checkStock.rowCount === 0) {
      return { message: 'product not found' };
    }
    if (+checkStock.rows[0].stock === 0) {
      result = { message: 'stock is 0 please update the stock product' };
    } else if (request.payload.qty > checkStock.rows[0].stock) {
      result = { message: 'qty can\'t be bigger than stock' };
    } else {
      calculateAmount(request, checkStock, request.payload.qty);
      // updated product stock
      await updateStok(checkStock.rows[0].stock, sku, qty);
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
    return {
      message: err.toString(),
    };
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
    return {
      message: err.toString(),
    };
  }
};

const getTransactionBy = async (request) => {
  try {
    const text = `
      SELECT sku, qty, amount from adjustment_transaction
      WHERE sku='${request.params.sku}'
    `;
    const res = await pool.query(text);
    if (+res.rowCount === 0) {
      return {
        data: 'transaction not found',
      };
    }
    return {
      data: res.rows[0],
    };
  } catch (err) {
    return {
      message: err.toString(),
    };
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
      return { message: 'transaction not found' };
    }
    // restore product stokck if adjustment_transaction deleted
    const textUdateStockProduct = `UPDATE product SET stock=$1 WHERE sku='${sku}'`;
    const updateStock = +sumQty.rows[0].total + +lastStock.rows[0].stock;
    await pool.query(textUdateStockProduct, [updateStock]);

    // delete adjustment_transaction
    const text = `DELETE from adjustment_transaction WHERE sku='${sku}'`;
    const res = await pool.query(text);
    if (+res.rowCount === 0) {
      return {
        data: 'transaction not found',
      };
    }
    return { message: 'delete transaction succesfully' };
  } catch (err) {
    return {
      message: err.toString(),
    };
  }
};

const updateTransaction = async (request) => {
  try {
    /* rule for update transaction
      if params sku not equals in body then create new transaction and delete old transaction
      else check to transaction with params sku if 1 then update else no update
    */
    let message;
    // if change sku
    if (request.params.sku !== request.payload.sku) {
      await createTransaction(request);
      await deleteTransaction(request);
      message = `update transaction with new sku ${request.params.sku}`;
    } else {
      const checkStock = await checkStokProduct(request.params.sku);
      if (+checkStock.rowCount === 0) {
        return {
          data: 'product not found',
        };
      }

      // get last qty and validate
      const textLastQty = `
       SELECT qty from adjustment_transaction
       WHERE sku='${request.params.sku}'
     `;
      const checkLastQty = await pool.query(textLastQty);
      if (+checkLastQty.rowCount === 0) {
        return {
          data: 'transaction not found',
        };
      }
      // get qty if same update
      const textTransaction = `
        SELECT qty from adjustment_transaction
        WHERE sku='${request.params.sku}' and qty='${request.payload.qty}'
      `;
      const checkTransaction = await pool.query(textTransaction);
      if (+checkTransaction.rowCount === 0) {
        const tempStok = (+checkStock.rows[0].stock) + (+checkLastQty.rows[0].qty);
        if (request.payload.qty > tempStok) {
          message = 'qty can\'t be bigger than stock';
        } else {
        // update stock product
          await updateStok(tempStok, request.params.sku, request.payload.qty);
          // calculate amount
          calculateAmount(request, checkStock, request.payload.qty);

          const payloads = objectToArray(request.payload);
          const text = `
          UPDATE adjustment_transaction SET sku=$1, qty=$2, amount=$3
          WHERE sku='${request.params.sku}' RETURNING *`;
          const { rows } = await pool.query(text, payloads);
          if (rows[0]) {
            return rows[0];
          }
          // eslint-disable-next-line prefer-destructuring
          message = rows[0];
        }
      } else {
        message = 'data has updated, but no changes data';
      }
    }
    return { message };
  } catch (err) {
    return { message: err.toString() };
  }
};

module.exports = {
  createTransaction,
  getTransaction,
  getTransactionBy,
  updateTransaction,
  deleteTransaction,
};
