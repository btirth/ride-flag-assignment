const {
  convertCurrency,
  validateRequest,
} = require("../../src/services/conversionService");

describe("Convert currency", () => {
  test("Valid conversion request", async () => {
    const body = {
      date: "2023-01-03",
      currency: "U.S. dollar, daily average",
      amount_in_cad: 100.055,
    };

    const validation = await validateRequest(
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

    const validation = await validateRequest(
      body.date,
      body.currency,
      body.amount_in_cad
    );
    expect(validation.valid).toBe(false);
    expect(validation.errors.length === 3).toBe(true);
  });

  test("Invalid currency", async () => {
    const body = {
      date: "2023-05-31",
      currency: "Invalid currency",
      amount_in_cad: 100.1234,
    };

    const validation = await validateRequest(
      body.date,
      body.currency,
      body.amount_in_cad
    );

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some(
        (err) =>
          err.field === "currency" &&
          err.message ===
            `Currency: ${body.currency}, is not supported at this moment.`
      )
    ).toBe(true);
  });

  test("Invalid date", async () => {
    const body = {
      date: "invalid-date",
      currency: "U.S. dollar, daily average",
      amount_in_cad: 100,
    };

    const validation = await validateRequest(
      body.date,
      body.currency,
      body.amount_in_cad
    );
    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some(
        (err) =>
          err.field === "date" &&
          err.message ===
            "Invalid date, Please provide valid date in 'YYYY-MM-DD' format."
      )
    ).toBe(true);
  });

  test("Invalid amount_in_cad", async () => {
    const body = {
      date: "2023-05-31",
      currency: "Australian dollar, daily average",
      amount_in_cad: "invalid",
    };

    const validation = await validateRequest(
      body.date,
      body.currency,
      body.amount_in_cad
    );
    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some(
        (err) =>
          err.field === "amount_in_cad" && err.message === "Invalid amount."
      )
    ).toBe(true);
  });
});
