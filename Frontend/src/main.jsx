import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { TemperatureUnitProvider } from "./utils/temperature";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TemperatureUnitProvider>
      <App />
    </TemperatureUnitProvider>
  </StrictMode>,
);
