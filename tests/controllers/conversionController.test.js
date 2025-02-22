const request = require("supertest");
const app = require("../../src/app");
const currencyService = require("../../src/services/conversionService");

jest.mock("../../src/services/conversionService");

const mockResponse = (statusCode, body) => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    statusCode,
    body,
  };
};

describe("Convert currency", () => {
  test("Valid conversion request", async () => {
    currencyService.validateRequest.mockReturnValue({
      valid: true,
      amountInCAD: 100.1234,
    });
    currencyService.convertCurrency.mockResolvedValue({
      date: "2023-05-31",
      currency: "Australian dollar, daily average",
      amount_in_cad: 100.1234,
      exchange_rate: 1.5,
      amount_in_currency: 150.1851,
    });

    const response = await request(app).post("/convert").send({
      date: "2023-05-31",
      currency: "Australian dollar, daily average",
      amount_in_cad: 100.1234,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("amount_in_currency");
    expect(response.body).toHaveProperty("exchange_rate");
    expect(typeof response.body.exchange_rate).toBe("number");
    expect(typeof response.body.amount_in_currency).toBe("number");
  });

  test("Missing parameters", async () => {
    currencyService.validateRequest.mockReturnValue({
      valid: false,
      errors: ["Missing required parameters"],
    });

    const response = await request(app).post("/convert").send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toContain("Missing required parameters");
  });

  test("Invalid currency", async () => {
    currencyService.validateRequest.mockReturnValue({
      valid: true,
      amountInCAD: 100.1234,
    });
    currencyService.convertCurrency.mockResolvedValue({
      statusCode: 404,
      error: "Exchange rate not found for the given date and currency",
    });

    const response = await request(app).post("/convert").send({
      date: "2023-05-31",
      currency: "Invalid currency",
      amount_in_cad: 100.1234,
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(
      "Exchange rate not found for the given date and currency"
    );
  });

  test("Invalid date format", async () => {
    currencyService.validateRequest.mockReturnValue({
      valid: false,
      errors: ["Invalid date format"],
    });

    const response = await request(app).post("/convert").send({
      date: "invalid-date",
      currency: "U.S. dollar, daily average",
      amount_in_cad: 100,
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toContain("Invalid date format");
  });

  test("Invalid amount_in_cad", async () => {
    currencyService.validateRequest.mockReturnValue({
      valid: false,
      errors: ["Invalid amount"],
    });

    const response = await request(app).post("/convert").send({
      date: "2023-05-31",
      currency: "Australian dollar, daily average",
      amount_in_cad: "invalid",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toContain("Invalid amount");
  });
});
