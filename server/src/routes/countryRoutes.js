const express = require('express');
const router = express.Router();

const { getCountries } = require('../controllers/countryController');

// Public route for signup form
router.get('/', getCountries);

module.exports = router;
