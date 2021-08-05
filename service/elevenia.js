/* eslint-disable prefer-spread */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
const format = require('pg-format');
const xml2js = require('xml2js');
const axios = require('axios');
const { pool } = require('../config/db');
const { objectToArray } = require('../utils');

const syncData = async () => {
  try {
    const key = { openapikey: process.env.ELEVENIA_KEY };
    const data = [];
    for (let i = 1; i <= 4; i++) {
      const result = await axios.get(
        `${process.env.ELEVENIA_API}/prodservices/product/listing?page=${i}`,
        {
          headers: key,
        },
      );
      const list = await xml2js.parseStringPromise(result.data);
      const params = list.Products.product.map(({ prdNo }) => prdNo);

      data.push(params);
    }

    const merged = [].concat.apply([], data);

    const dataElevenia = [];
    const promises = [];
    for (let i = 0; i < merged.length; i++) {
      promises.push(
        Promise.all([
          axios.get(
            `${process.env.ELEVENIA_API}/prodservices/product/details/${merged[i]}`,
            {
              headers: key,
            },
          ),
          axios.get(
            ` ${process.env.ELEVENIA_API}/prodmarketservice/prodmarket/stck/${merged[i]}`,
            {
              headers: key,
            },
          ),
        ]).then(async ([resProduct, resStock]) => {
          const parseProduct = await xml2js.parseStringPromise(resProduct.data);
          const parsedStock = await xml2js.parseStringPromise(resStock.data);

          const Name = parseProduct.Product.prdNm;
          const SKU = parsedStock.ProductStocks.sellerPrdCd;
          const Image = parseProduct.Product.prdImage01;
          const Price = parseProduct.Product.selPrc;
          const ProductDetail = parseProduct.Product.htmlDetail;
          const Stock = parsedStock.ProductStocks.ProductStock;

          dataElevenia.push({
            Name,
            Image,
            ProductDetail,
            Price,
            Stock,
            SKU,
          });
        }),
      );
    }
    return Promise.all(promises).then(async () => {
      const text = format(`INSERT INTO product 
      (name, image, description, price, stock, sku) VALUES %L on
      conflict on
      constraint product_pk do nothing`, objectToArray(dataElevenia));
      await pool.query(text);
      return {
        message: 'sync product success',
      };
    });
  } catch (error) {
    return error;
  }
};

module.exports = { syncData };
