import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import AppHeader from "../../components/AppHeader/AppHeader";
import TankCard from "../../components/TankCard/TankCard";
import TankWarnings from "../../components/TankWarnings/TankWarnings";
import { db } from "../../firebase/Config";
import "./TanksPage.css";

const emptyTank = {
  name: "",
  type: "",
  gallons: "",
  temperature: "",
  ph: "",
  ammonia: "",
};

function TanksPage({ currentUser, onSelectTank, onSignOut, tanks }) {
  const [isAddingTank, setIsAddingTank] = useState(false);
  const [newTank, setNewTank] = useState(emptyTank);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleTankChange(event) {
    setNewTank({ ...newTank, [event.target.name]: event.target.value });
  }

  async function handleAddTank(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await addDoc(collection(db, "tanks"), {
        name: newTank.name.trim(),
        type: newTank.type.trim(),
        gallons: Number(newTank.gallons),
        temperature: Number(newTank.temperature),
        ph: Number(newTank.ph),
        ammonia: Number(newTank.ammonia),
        status: "Normal",
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setNewTank(emptyTank);
      setIsAddingTank(false);
    } catch {
      setError("AquaGuard could not add this tank.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <AppHeader
        currentUser={currentUser}
        onHome={() => {}}
        onSignOut={onSignOut}
      />
      <main className="page-content">
        <TankWarnings
          tanks={tanks}
          onSelectTank={onSelectTank}
          currentUser={currentUser}
        />
        <section className="page-intro">
          <p className="eyebrow">Team aquariums</p>
          <h1>All tanks</h1>
          <p>View current conditions for every aquarium in AquaGuard.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => setIsAddingTank(!isAddingTank)}
          >
            {isAddingTank ? "Cancel" : "Add Tank"}
          </button>
        </section>
        {isAddingTank && (
          <section className="panel add-tank-panel">
            <h2>Add Tank</h2>
            <form className="add-tank-form" onSubmit={handleAddTank}>
              <label>
                Tank Name
                <input
                  name="name"
                  value={newTank.name}
                  onChange={handleTankChange}
                  required
                />
              </label>
              <label>
                Tank Type
                <input
                  name="type"
                  placeholder="Freshwater or Saltwater"
                  value={newTank.type}
                  onChange={handleTankChange}
                  required
                />
              </label>
              <label>
                Gallons
                <input
                  min="1"
                  name="gallons"
                  type="number"
                  value={newTank.gallons}
                  onChange={handleTankChange}
                  required
                />
              </label>
              <label>
                Temperature (°F)
                <input
                  name="temperature"
                  step="0.1"
                  type="number"
                  value={newTank.temperature}
                  onChange={handleTankChange}
                  required
                />
              </label>
              <label>
                pH
                <input
                  min="0"
                  max="14"
                  name="ph"
                  step="0.1"
                  type="number"
                  value={newTank.ph}
                  onChange={handleTankChange}
                  required
                />
              </label>
              <label>
                Ammonia (ppm)
                <input
                  min="0"
                  name="ammonia"
                  step="0.01"
                  type="number"
                  value={newTank.ammonia}
                  onChange={handleTankChange}
                  required
                />
              </label>
              {error && <p className="add-tank-error">{error}</p>}
              <button
                className="primary-button"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Adding..." : "Add Tank"}
              </button>
            </form>
          </section>
        )}
        <section className="tank-card-grid" aria-label="Aquariums">
          {tanks.map((tank) => (
            <TankCard
              currentUser={currentUser}
              key={tank.id}
              onSelect={onSelectTank}
              tank={tank}
            />
          ))}
        </section>
        {tanks.length === 0 && <p>No tanks yet.</p>}
      </main>
    </div>
  );
}

export default TanksPage;
