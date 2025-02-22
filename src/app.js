const express = require("express");
const logger = require("./utils/logger.js");
const conversionRoutes = require("./routes/conversionRoutes.js");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

app.use("/convert", conversionRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
