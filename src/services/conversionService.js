const { parseISO, isValid } = require("date-fns");
const loadExchangeRates = require("../utils/exchangeRateLoader");
const logger = require("../utils/logger");

let exchangeRates = [];

/**
 * Loads the exchange rates from the CSV file
 */
const initPromise = loadExchangeRates()
  .then((rates) => {
    exchangeRates = rates;
  })
  .catch((error) => {
    logger.error(`Failed to load exchange rates: ${error.message}`);
  });

/**
 * Validates request body for missing or invalid parameters
 * @param {*} date - To consider exchange rate on that particular day
 * @param {*} currency - Expected currency to convert from CAD
 * @param {*} amount_in_cad - Amount in CAD to convert based on given currency and date
 * @returns {Array<Object>} - Validation result with errors or validated amount in CAD
 */
exports.validateRequest = (date, currency, amount_in_cad) => {
  const validationErrors = [];

  if (!date) validationErrors.push("date is required");
  if (!currency) validationErrors.push("currency is required");
  if (!amount_in_cad) validationErrors.push("amount_in_cad is required");

  if (date && !isValid(parseISO(date)))
    validationErrors.push(
      "Invalid date, Please provide valid date in 'YYYY-MM-DD' format"
    );

  const amountInCAD = parseFloat(amount_in_cad);
  if (amount_in_cad && isNaN(amountInCAD))
    validationErrors.push("Invalid amount");

  if (validationErrors.length > 0)
    return { valid: false, errors: validationErrors };

  return { valid: true, amountInCAD };
};

/**
 * This function finds exchange rate for given date and currency
 * @param {*} date - Date to find exchange rate on that day
 * @param {*} currency - Currency to find exchange rate
 * @returns {Object|null} - Exchange rate object if found, otherwise null
 */
const findExchangeRate = (date, currency) => {
  return exchangeRates.find(
    (rate) => rate.date === date && rate.currency === currency
  );
};

exports.convertCurrency = async (date, currency, amountInCAD) => {
  await initPromise;

  const exchangeRateData = findExchangeRate(date, currency);
  if (!exchangeRateData) {
    return {
      statusCode: 404,
      error: "Exchange rate not found for the given date and currency",
    };
  }

  const exchangeRate = parseFloat(exchangeRateData.value);
  if (isNaN(exchangeRate)) {
    return { statusCode: 500, error: "Invalid exchange rate" };
  }

  return {
    date,
    currency,
    amount_in_cad: amountInCAD,
    exchange_rate: exchangeRate,
    amount_in_currency: parseFloat(amountInCAD / exchangeRate),
  };
};
