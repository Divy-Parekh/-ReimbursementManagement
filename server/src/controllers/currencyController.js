const { getExchangeRate, convertCurrency } = require('../services/currencyService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Convert currency endpoint
 * @route GET /api/currency/convert
 */
const convert = async (req, res, next) => {
  try {
    const { from, to, amount } = req.query;

    if (!from || !to || !amount) {
      return sendError(res, 400, 'Missing required parameters: from, to, amount');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return sendError(res, 400, 'Amount must be a positive number');
    }

    const rate = await getExchangeRate(from.toUpperCase(), to.toUpperCase());
    const convertedAmount = parsedAmount * rate;

    return sendSuccess(res, 200, 'Currency converted successfully', {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount: parsedAmount,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      rate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error.message.includes('not found for currency') || error.message.includes('Failed to fetch')) {
       return sendError(res, 400, error.message);
    }
    next(error);
  }
};

module.exports = {
  convert,
};
