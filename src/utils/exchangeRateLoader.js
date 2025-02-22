const path = require("path");
const fs = require("fs");
const { parseISO, isValid } = require("date-fns");
const csv = require("csv-parser");
const dotenv = require("dotenv");

dotenv.config();
const filePath = path.resolve(
  __dirname,
  process.env.exchangeRates || "../../data/exchange_rates.csv"
);

/**
 * This function loads exchange rates from CSV file.
 * Reference: https://stackoverflow.com/questions/23080413/parsing-a-csv-file-using-nodejs
 * @returns {Promise<Array<{ date: string, country: string, currency: string, value: number | null }>>}
 */
const loadExchangeRates = () => {
  return new Promise((resolve, reject) => {
    let exchangeRates = [];
    fs.createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().replace(/^["']|["']$/g, ""),
        })
      )
      .on("data", (data) => {
        const validData = validateExchangeRateRow(data);
        if (validData) exchangeRates.push(validData);
      })
      .on("end", () => {
        resolve(exchangeRates);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

/**
 * Validates exchange rate data, only load valid data
 * @param {*} data - exchange rate CSV row
 * @returns
 */
const validateExchangeRateRow = (data) => {
  const date = data.REF_DATE?.trim();
  const country = data.GEO?.trim();
  const currency = data["Type of currency"]?.trim();
  const value = data.VALUE?.trim();
  const parsedValue = value ? parseFloat(value) : null;

  if (
    !date ||
    !isValid(parseISO(date)) ||
    !country ||
    !currency ||
    parsedValue === null ||
    isNaN(parsedValue)
  ) {
    return null;
  }

  return {
    date,
    country,
    currency,
    value: parsedValue,
  };
};

module.exports = loadExchangeRates;
