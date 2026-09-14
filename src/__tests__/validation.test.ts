import { describe, it, expect } from "vitest";
import { isValidCityName } from "@/lib/validation";

describe("isValidCityName", () => {
  it("accepts simple city names", () => {
    expect(isValidCityName("London")).toBe(true);
    expect(isValidCityName("Paris")).toBe(true);
  });

  it("accepts city names with spaces", () => {
    expect(isValidCityName("New York")).toBe(true);
    expect(isValidCityName("Rio de Janeiro")).toBe(true);
  });

  it("accepts city names with hyphens, apostrophes, and periods", () => {
    expect(isValidCityName("Winston-Salem")).toBe(true);
    expect(isValidCityName("O'Fallon")).toBe(true);
    expect(isValidCityName("St. Louis")).toBe(true);
  });

  it("accepts accented and unicode letters", () => {
    expect(isValidCityName("São Paulo")).toBe(true);
    expect(isValidCityName("Zürich")).toBe(true);
    expect(isValidCityName("Москва")).toBe(true);
  });

  it("accepts a single letter", () => {
    expect(isValidCityName("A")).toBe(true);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidCityName("  London  ")).toBe(true);
  });

  it("rejects purely numeric input", () => {
    expect(isValidCityName("12345")).toBe(false);
  });

  it("rejects city names mixed with digits", () => {
    expect(isValidCityName("London123")).toBe(false);
    expect(isValidCityName("123London")).toBe(false);
    expect(isValidCityName("Lon don2")).toBe(false);
  });

  it("rejects empty or whitespace-only input", () => {
    expect(isValidCityName("")).toBe(false);
    expect(isValidCityName("   ")).toBe(false);
  });

  it("rejects strings with symbols other than ' . -", () => {
    expect(isValidCityName("London!")).toBe(false);
    expect(isValidCityName("London@City")).toBe(false);
    expect(isValidCityName("London_City")).toBe(false);
  });
});
