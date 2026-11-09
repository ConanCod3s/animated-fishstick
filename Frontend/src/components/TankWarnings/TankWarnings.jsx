import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/Config";

function TankWarnings({ tanks, onSelectTank, currentUser }) {
  const [clearingId, setClearingId] = useState(null);
  const [error, setError] = useState("");
  const warningTanks = tanks.filter(
    (tank) => tank.warningPending ?? tank.status === "Warning",
  );

  async function clearWarning(tankId) {
    setClearingId(tankId);
    setError("");
    try {
      await updateDoc(doc(db, "tanks", tankId), { warningPending: false });
    } catch {
      setError("Could not clear the warning. Please try again.");
    } finally {
      setClearingId(null);
    }
  }
  return (
    <div aria-live="polite" aria-atomic="true">
      {warningTanks.length > 0 && (
        <section className="tank-warnings" aria-label="Tank warnings">
          <strong>Warning: anomaly detected</strong>
          <ul>
            {warningTanks.map((tank) => (
              <li key={tank.id}>
                {tank.name}: Unusual tank reading detected. Goto the live
                readings and ask AquaGuard AI for help.
                {onSelectTank && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => onSelectTank(tank.id)}
                  >
                    Go to tank
                  </button>
                )}
                {currentUser.uid === tank.ownerId && (
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={clearingId !== null}
                    onClick={() => clearWarning(tank.id)}
                  >
                    {clearingId === tank.id ? "Clearing..." : "Clear"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export default TankWarnings;
