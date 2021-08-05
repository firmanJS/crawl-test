/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
const objectToArray = (obj) => {
  const payloads = [];
  for (const key in obj) {
    payloads.push(obj[key]);
  }

  return payloads;
};

module.exports = {
  objectToArray,
};
