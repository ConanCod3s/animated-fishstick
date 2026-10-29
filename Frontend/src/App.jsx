import { useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage/LoginPage";
import TankDetailPage from "./pages/TankDetailPage/TankDetailPage";
import TanksPage from "./pages/TanksPage/TanksPage";
import { EXAMPLE_TANKS as tanks } from "./utils/constants";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTankId, setSelectedTankId] = useState(null);
  const selectedTank = tanks.find((tank) => tank.id === selectedTankId);

  function handleSignOut() {
    setSelectedTankId(null);
    setCurrentUser(null);
  }

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  if (selectedTank) {
    return (
      <TankDetailPage
        currentUser={currentUser}
        onBack={() => setSelectedTankId(null)}
        onSignOut={handleSignOut}
        tank={selectedTank}
      />
    );
  }

  return (
    <TanksPage
      currentUser={currentUser}
      onSelectTank={setSelectedTankId}
      onSignOut={handleSignOut}
      tanks={tanks}
    />
  );
}

export default App;
