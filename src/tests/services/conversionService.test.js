const {
  convertCurrency,
  validateRequest,
} = require("../../services/conversionService");

describe("Convert currency", () => {
  test("Valid conversion request", async () => {
    const body = {
      date: "2023-05-31",
      currency: "Australian dollar, daily average",
      amount_in_cad: 100.1234,
    };

    const validation = validateRequest(
      body.date,
      body.currency,
      body.amount_in_cad
    );
    expect(validation.valid).toBe(true);

    const response = await convertCurrency(
      body.date,
      body.currency,
      validation.amountInCAD
    );

    expect(response).toHaveProperty("amount_in_currency");
    expect(response).toHaveProperty("exchange_rate");
    expect(typeof response.exchange_rate).toBe("number");
    expect(typeof response.amount_in_currency).toBe("number");
  });

  test("Missing parameters", async () => {
    const body = {};

    const validation = validateRequest(
      body.date,
      body.currency,
      body.amount_in_cad
    );
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("date is required");
    expect(validation.errors).toContain("currency is required");
    expect(validation.errors).toContain("amount_in_cad is required");
  });

  test("Invalid currency", async () => {
    const body = {
      date: "2023-05-31",
      currency: "Invalid currency",
      amount_in_cad: 100.1234,
    };

    const validation = validateRequest(
      body.date,
      body.currency,
      body.amount_in_cad
    );
    expect(validation.valid).toBe(true);

    const response = await convertCurrency(
      body.date,
      body.currency,
      validation.amountInCAD
    );
    expect(response.statusCode).toBe(404);
    expect(response.error).toBe(
      "Exchange rate not found for the given date and currency"
    );
  });

  test("Invalid date", () => {
    const body = {
      date: "invalid-date",
      currency: "U.S. dollar, daily average",
      amount_in_cad: 100,
    };

    const validation = validateRequest(
      body.date,
      body.currency,
      body.amount_in_cad
    );
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain(
      "Invalid date, Please provide valid date in 'YYYY-MM-DD' format"
    );
  });

  test("Invalid amount_in_cad", () => {
    const body = {
      date: "2023-05-31",
      currency: "Australian dollar, daily average",
      amount_in_cad: "invalid",
    };

    const validation = validateRequest(
      body.date,
      body.currency,
      body.amount_in_cad
    );
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("Invalid amount");
  });
});
