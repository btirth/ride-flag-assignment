const { parseISO, isValid } = require("date-fns");
const loadExchangeRates = require("../utils/exchangeRateLoader");
const logger = require("../utils/logger");

let exchangeRates = [];
let supportedCurrencies = [];

/**
 * Loads the exchange rates from the CSV file
 */
const initPromise = loadExchangeRates()
  .then((rates) => {
    exchangeRates = rates;
    supportedCurrencies = [
      ...new Set(exchangeRates.map((rate) => rate.currency)),
    ];
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
exports.validateRequest = async (date, currency, amount_in_cad) => {
  await initPromise;
  const validationErrors = [];

  if (!date) {
    validationErrors.push({
      field: "date",
      message: "Date is required field.",
    });
  } else if (!isValid(parseISO(date))) {
    validationErrors.push({
      field: "date",
      message:
        "Invalid date, Please provide valid date in 'YYYY-MM-DD' format.",
    });
  }

  if (!currency) {
    validationErrors.push({
      field: "currency",
      message: "currency is required field.",
    });
  } else if (!supportedCurrencies.includes(currency)) {
    validationErrors.push({
      field: "currency",
      message: `Currency: ${currency}, is not supported at this moment.`,
    });
  }

  if (!amount_in_cad) {
    validationErrors.push({
      field: "amount_in_cad",
      message: "amount_in_cad is required field.",
    });
  }

  const amountInCAD = parseFloat(amount_in_cad);
  if (amount_in_cad && isNaN(amountInCAD)) {
    validationErrors.push({
      field: "amount_in_cad",
      message: "Invalid amount.",
    });
  }

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
  const exchangeRateData = findExchangeRate(date, currency);
  if (!exchangeRateData) {
    return {
      statusCode: 404,
      error: "Exchange rate not found for the given date and currency.",
    };
  }

  const exchangeRate = parseFloat(exchangeRateData.value);
  if (isNaN(exchangeRate)) {
    return { statusCode: 500, error: "Invalid exchange rate." };
  }

  const convertedAmount = parseFloat((amountInCAD / exchangeRate).toFixed(4));

  return {
    date,
    currency,
    amount_in_cad: amountInCAD,
    exchange_rate: exchangeRate,
    amount_in_currency: convertedAmount,
  };
};
