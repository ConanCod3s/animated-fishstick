import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import "./App.css";
import { auth, db } from "./firebase/Config";
import LoginPage from "./pages/LoginPage/LoginPage";
import TankDetailPage from "./pages/TankDetailPage/TankDetailPage";
import TanksPage from "./pages/TanksPage/TanksPage";

async function hasApprovedProfile(user) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const userProfile = await getDoc(doc(db, "users", user.uid));

      if (userProfile.exists() && userProfile.data().approved) {
        return true;
      }
    } catch {
      // The profile has not been created yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [tanks, setTanks] = useState([]);
  const selectedTank = tanks.find((tank) => tank.id === selectedTankId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setIsAuthLoading(false);
        return;
      }

      const isApproved = await hasApprovedProfile(user);

      if (isApproved) {
        setCurrentUser(user);
        setAuthError("");
      } else {
        setAuthError("This email is not approved for AquaGuard.");
        await signOut(auth);
      }

      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    return onSnapshot(collection(db, "tanks"), (snapshot) => {
      setTanks(snapshot.docs.map((tank) => ({ id: tank.id, ...tank.data() })));
    });
  }, [currentUser]);

  async function handleSignOut() {
    setSelectedTankId(null);
    await signOut(auth);
  }

  if (isAuthLoading) {
    return null;
  }

  if (!currentUser) {
    return <LoginPage errorMessage={authError} />;
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
