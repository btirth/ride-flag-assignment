const fs = require("fs");
const csv = require("csv-parser");
const loadExchangeRates = require("../../utils/exchangeRateLoader");

jest.mock("fs");
jest.mock("csv-parser", () => jest.fn());

describe("loadExchangeRates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should load and parse exchange rates", async () => {
    const mockCsvData = [
      {
        REF_DATE: "2023-05-31",
        "Type of currency": "Australian dollar, daily average",
        VALUE: "1.23",
      },
    ];

    const mockStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn((event, callback) => {
        if (event === "data") {
          mockCsvData.forEach((row) => callback(row));
        }
        if (event === "end") {
          callback();
        }
        return mockStream;
      }),
    };
    fs.createReadStream.mockReturnValue(mockStream);

    const result = await loadExchangeRates();

    expect(result).toEqual([
      {
        date: "2023-05-31",
        currency: "Australian dollar, daily average",
        value: 1.23,
      },
    ]);

    expect(csv).toHaveBeenCalledWith({
      mapHeaders: expect.any(Function),
    });
  });

  test("should handle errors when reading the CSV file", async () => {
    const mockStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn((event, callback) => {
        if (event === "error") {
          callback(new Error("File read error"));
        }
        return mockStream;
      }),
    };
    fs.createReadStream.mockReturnValue(mockStream);

    await expect(loadExchangeRates()).rejects.toThrow("File read error");
  });

  test("should handle invalid or missing values in CSV data", async () => {
    const mockCsvData = [
      {
        REF_DATE: "2023-05-31",
        "Type of currency": "Australian dollar, daily average",
        VALUE: "invalid",
      },
      {
        REF_DATE: "2023-05-31",
        "Type of currency": "U.S. dollar, daily average",
        VALUE: "",
      },
    ];

    const mockStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn((event, callback) => {
        if (event === "data") {
          mockCsvData.forEach((row) => callback(row));
        }
        if (event === "end") {
          callback();
        }
        return mockStream;
      }),
    };
    fs.createReadStream.mockReturnValue(mockStream);

    const result = await loadExchangeRates();

    expect(result).toEqual([]);
  });
});
