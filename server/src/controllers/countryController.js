const { fetchCountries } = require('../services/countryService');
const { sendSuccess } = require('../utils/responseHelper');

/**
 * Get all countries with their currencies
 * @route GET /api/countries
 */
const getCountries = async (req, res, next) => {
  try {
    const countries = await fetchCountries();
    return sendSuccess(res, 200, 'Countries fetched successfully', countries, countries.length);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCountries,
};
