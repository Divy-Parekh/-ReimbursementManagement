const express = require('express');
const router = express.Router();

const { convert } = require('../controllers/currencyController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/convert', convert);

module.exports = router;
