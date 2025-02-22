const currencyService = require("../services/conversionService");
const logger = require("../utils/logger");

/**
 * Converts amount in CAD to requested currency on given date
 */
exports.convertCurrency = async (req, res) => {
  try {
    const { date, currency, amount_in_cad } = req.body;

    const validation = currencyService.validateRequest(
      date,
      currency,
      amount_in_cad
    );
    if (!validation.valid) {
      logger.error(validation.errors.join(", "));
      return res.status(400).json({ errors: validation.errors });
    }

    const result = await currencyService.convertCurrency(
      date,
      currency,
      validation.amountInCAD
    );
    if (result.error) {
      logger.error(result.error);
      return res.status(result.statusCode).json({ error: result.error });
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error occurred: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
