import { APP_NAME } from "../../utils/constants";
import "./AppHeader.css";

function AppHeader({ currentUser, onHome, onSignOut }) {
  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={onHome}>
        {APP_NAME}
      </button>
      <div className="account-menu">
        <span>{currentUser.email}</span>
        <button className="header-button" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
