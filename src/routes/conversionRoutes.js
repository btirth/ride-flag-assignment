const express = require("express");
const { convertCurrency } = require("../controllers/conversionController.js");

const router = express.Router();

router.post("/", convertCurrency);

module.exports = router;
