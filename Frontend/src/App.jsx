import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "./App.css";
import { auth } from "./firebase/Config";
import LoginPage from "./pages/LoginPage/LoginPage";
import TankDetailPage from "./pages/TankDetailPage/TankDetailPage";
import TanksPage from "./pages/TanksPage/TanksPage";
import { EXAMPLE_TANKS as tanks } from "./utils/constants";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedTankId, setSelectedTankId] = useState(null);
  const selectedTank = tanks.find((tank) => tank.id === selectedTankId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  async function handleSignOut() {
    setSelectedTankId(null);
    await signOut(auth);
  }

  if (isAuthLoading) {
    return null;
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
