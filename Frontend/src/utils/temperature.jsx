import { createContext, useContext, useEffect, useState } from "react";

// Readings are always stored in Firestore in Fahrenheit. These helpers only
// change how temperatures are shown and entered in the interface.

const TEMPERATURE_UNITS = {
  F: { key: "F", symbol: "°F" },
  C: { key: "C", symbol: "°C" },
};
const DEFAULT_UNIT = "F";
const STORAGE_KEY = "aquaguard.temperatureUnit";

function fahrenheitToCelsius(fahrenheit) {
  return ((fahrenheit - 32) * 5) / 9;
}

function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function toDisplayTemperature(fahrenheit, unit) {
  if (typeof fahrenheit !== "number" || Number.isNaN(fahrenheit)) {
    return fahrenheit;
  }

  return unit === "C"
    ? roundToOneDecimal(fahrenheitToCelsius(fahrenheit))
    : fahrenheit;
}

function toStoredTemperature(value, unit) {
  return unit === "C" ? roundToOneDecimal(celsiusToFahrenheit(value)) : value;
}

function readSavedUnit() {
  try {
    const savedUnit = window.localStorage.getItem(STORAGE_KEY);
    return TEMPERATURE_UNITS[savedUnit] ? savedUnit : DEFAULT_UNIT;
  } catch {
    return DEFAULT_UNIT;
  }
}

const TemperatureUnitContext = createContext({
  unit: DEFAULT_UNIT,
  symbol: TEMPERATURE_UNITS[DEFAULT_UNIT].symbol,
  setUnit: () => {},
});

function TemperatureUnitProvider({ children }) {
  const [unit, setUnit] = useState(readSavedUnit);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, unit);
    } catch {
      // Storage can be unavailable
    }
  }, [unit]);

  return (
    <TemperatureUnitContext.Provider
      value={{ unit, symbol: TEMPERATURE_UNITS[unit].symbol, setUnit }}
    >
      {children}
    </TemperatureUnitContext.Provider>
  );
}

function useTemperatureUnit() {
  return useContext(TemperatureUnitContext);
}

export {
  TEMPERATURE_UNITS,
  TemperatureUnitProvider,
  toDisplayTemperature,
  toStoredTemperature,
  useTemperatureUnit,
};
