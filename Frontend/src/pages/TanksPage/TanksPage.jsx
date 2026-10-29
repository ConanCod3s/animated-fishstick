import AppHeader from "../../components/AppHeader/AppHeader";
import TankCard from "../../components/TankCard/TankCard";

function TanksPage({ currentUser, onSelectTank, onSignOut, tanks }) {
  return (
    <div className="app-shell">
      <AppHeader
        currentUser={currentUser}
        onHome={() => {}}
        onSignOut={onSignOut}
      />
      <main className="page-content">
        <section className="page-intro">
          <p className="eyebrow">Team aquariums</p>
          <h1>All tanks</h1>
          <p>View current conditions for every aquarium in AquaGuard.</p>
        </section>
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
      </main>
    </div>
  );
}

export default TanksPage;
