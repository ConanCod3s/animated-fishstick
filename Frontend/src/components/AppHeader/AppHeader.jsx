import { APP_NAME } from "../../utils/constants";
import { TEMPERATURE_UNITS, useTemperatureUnit } from "../../utils/temperature";
import "./AppHeader.css";

function AppHeader({ currentUser, onHome, onSignOut }) {
  const { unit, setUnit } = useTemperatureUnit();

  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={onHome}>
        {APP_NAME}
      </button>
      <div className="account-menu">
        <div className="unit-toggle" role="group" aria-label="Temperature unit">
          {Object.values(TEMPERATURE_UNITS).map((option) => (
            <button
              aria-pressed={unit === option.key}
              className={
                unit === option.key ? "unit-option active" : "unit-option"
              }
              key={option.key}
              type="button"
              onClick={() => setUnit(option.key)}
            >
              {option.symbol}
            </button>
          ))}
        </div>
        <span>{currentUser.email}</span>
        <button className="header-button" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
