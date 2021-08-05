/* eslint-disable prefer-spread */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
const xml2js = require('xml2js');
const axios = require('axios');

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

          const Id = parseProduct.Product.prdNo;
          const Name = parseProduct.Product.prdNm;
          const SKU = parsedStock.ProductStocks.sellerPrdCd;
          const Image = parseProduct.Product.prdImage01;
          const Price = parseProduct.Product.selPrc;
          const ProductDetail = parseProduct.Product.htmlDetail;
          const Stock = parsedStock.ProductStocks.ProductStock;

          dataElevenia.push({
            Id,
            Name,
            SKU,
            Image,
            Price,
            Stock,
            ProductDetail,
          });
        }),
      );
    }
    return Promise.all(promises).then(() => dataElevenia);
  } catch (error) {
    return error;
  }
};

module.exports = { syncData };
