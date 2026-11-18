import AppHeader from "../../components/AppHeader/AppHeader";
import TankWarnings from "../../components/TankWarnings/TankWarnings";
import AIChat from "./AIChat/AIChat";
import Monitoring from "./Monitoring/Monitoring";
import Simulations from "./Simulations/Simulations";
import "./TankDetailPage.css";

function TankDetailPage({ currentUser, onBack, onSignOut, tank }) {
  const isOwner = currentUser.uid === tank.ownerId;
  const statusClass =
    tank.status === "Warning" ? "status-warning" : "status-normal";
  return (
    <div className="app-shell">
      <AppHeader
        currentUser={currentUser}
        onHome={onBack}
        onSignOut={onSignOut}
      />
      <main className="page-content">
        <button className="back-button" type="button" onClick={onBack}>
          ← Return to All Tanks
        </button>
        <TankWarnings tanks={[tank]} currentUser={currentUser} />
        <section className="tank-detail-heading">
          <div>
            <p className="eyebrow">{tank.type}</p>
            <h1>{tank.name}</h1>
            <p>{tank.gallons} gallons</p>
          </div>
          <span className={`status ${statusClass}`}>{tank.status}</span>
        </section>
        <div className="detail-grid">
          <Monitoring tank={tank} />
          <AIChat key={tank.id} tank={tank} currentUser={currentUser} />
        </div>
        {isOwner && <Simulations key={tank.id} tank={tank} />}
      </main>
    </div>
  );
}

export default TankDetailPage;
