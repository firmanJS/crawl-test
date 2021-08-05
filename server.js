/* eslint-disable no-console */
const Hapi = require('@hapi/hapi');
const {
  createProduct, getProduct, getProductBy, updateProduct, deleteProduct,
} = require('./service/product');
const {
  createTransaction, getTransaction, getTransactionBy, updateTransaction, deleteTransaction,
} = require('./service/transaction');

const { syncData } = require('./service/elevenia');
require('dotenv').config();

const init = async () => {
  const server = Hapi.server({
    port: process.env.APP_PORT,
    host: process.env.APP_HOST,
  });

  await server.start();
  console.info('Server running on %s', server.info.uri);

  server.route({
    method: 'GET',
    path: '/',
    handler: () => ({
      message: 'hello',
    }),
  });
  // product
  server.route({
    method: 'POST',
    path: '/product',
    handler: (request) => createProduct(request),
  });
  server.route({
    method: 'GET',
    path: '/product',
    handler: (request) => getProduct(request),
  });
  server.route({
    method: 'GET',
    path: '/product/{sku}',
    handler: (request) => getProductBy(request),
  });
  server.route({
    method: 'PUT',
    path: '/product/{sku}',
    handler: (request) => updateProduct(request),
  });
  server.route({
    method: 'DELETE',
    path: '/product/{sku}',
    handler: (request) => deleteProduct(request),
  });
  // transaction
  server.route({
    method: 'POST',
    path: '/transaction',
    handler: (request) => createTransaction(request),
  });
  server.route({
    method: 'GET',
    path: '/transaction',
    handler: (request) => getTransaction(request),
  });
  server.route({
    method: 'GET',
    path: '/transaction/{sku}',
    handler: (request) => getTransactionBy(request),
  });
  server.route({
    method: 'PUT',
    path: '/transaction/{sku}',
    handler: (request) => updateTransaction(request),
  });
  server.route({
    method: 'DELETE',
    path: '/transaction/{sku}',
    handler: (request) => deleteTransaction(request),
  });
  server.route({
    method: 'GET',
    path: '/sync',
    handler: syncData,
  });
};

process.on('unhandledRejection', (err) => {
  console.info(err);
  process.exit(1);
});

init();
