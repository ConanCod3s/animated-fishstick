import AppHeader from "../../components/AppHeader/AppHeader";
import "./TankDetailPage.css";

const readingFields = [
  { key: "temperature", label: "Temperature", unit: "°F" },
  { key: "ph", label: "pH", unit: "" },
  { key: "ammonia", label: "Ammonia", unit: "ppm" },
  { key: "nitrite", label: "Nitrite", unit: "ppm" },
  { key: "nitrate", label: "Nitrate", unit: "ppm" },
];

function TankDetailPage({ currentUser, onBack, onSignOut, tank }) {
  const isOwner = currentUser.email === tank.ownerEmail;
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
        <section className="tank-detail-heading">
          <div>
            <p className="eyebrow">{tank.type}</p>
            <h1>{tank.name}</h1>
            <p>
              {tank.gallons} gallons · {tank.stock}
            </p>
          </div>
          <span className={`status ${statusClass}`}>{tank.status}</span>
        </section>
        <div className="detail-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Live monitoring</p>
                <h2>Live Readings</h2>
              </div>
            </div>
            <div className="reading-grid">
              {readingFields.map((reading) => (
                <article className="reading-card" key={reading.key}>
                  <p>{reading.label}</p>
                  <strong>{tank[reading.key]}</strong>
                  <span>{reading.unit}</span>
                </article>
              ))}
            </div>
          </section>
          <section className="panel chat-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">AI assistant</p>
                <h2>Ask AquaGuard AI</h2>
              </div>
            </div>
            <div className="chat-messages" aria-live="polite">
              <p>Ask a question about {tank.name}'s tank!.</p>
            </div>
            <form className="chat-form">
              <label htmlFor="chat-message">Message</label>
              <div className="chat-input-row">
                <input
                  id="chat-message"
                  name="message"
                  placeholder="Hows the tank doing?"
                  type="text"
                  disabled
                />
              </div>
              <div className="chat-input-send-button">
                <button type="submit" disabled>
                  Send
                </button>
              </div>
            </form>
          </section>
        </div>
        {isOwner && (
          <section className="panel owner-panel">
            <div>
              <p className="eyebrow">Owner controls</p>
              <h2>Manage and test this tank</h2>
            </div>
            <div className="owner-actions">
              <button className="primary-button" type="button">
                Start simulation
              </button>
              <button className="secondary-button" type="button">
                Stop
              </button>
              <button className="warning-button" type="button">
                Inject anomaly
              </button>
              <button className="secondary-button" type="button">
                Edit details
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default TankDetailPage;
