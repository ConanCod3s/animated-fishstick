import { useState } from "react";
import AppHeader from "../../components/AppHeader/AppHeader";
import { AI_WORKER_URL } from "../../utils/constants";
import "./TankDetailPage.css";

const readingFields = [
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "ph", label: "pH", unit: "" },
  { key: "ammonia", label: "Ammonia", unit: "ppm" },
];

function TankDetailPage({ currentUser, onBack, onSignOut, tank }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  // TODO: Use tank.ownerId and currentUser.uid once tanks load from Firestore.
  const isOwner = currentUser.email === tank.ownerEmail;
  const statusClass =
    tank.status === "Warning" ? "status-warning" : "status-normal";

  async function handleChatSubmit(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { sender: "You", text: trimmedMessage },
    ]);
    setMessage("");
    setIsSending(true);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${AI_WORKER_URL}/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          tank: {
            id: tank.id,
            name: tank.name,
            type: tank.type,
            gallons: tank.gallons,
            status: tank.status,
            temperature: tank.temperature,
            ph: tank.ph,
            ammonia: tank.ammonia,
          },
        }),
      });
      // TODO: Display an error message when the AI returns an error response.
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AquaGuard could not answer.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { sender: "AquaGuard", text: data.response },
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        { sender: "AquaGuard", text: error.message },
      ]);
    } finally {
      setIsSending(false);
    }
  }

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
            <p>{tank.gallons} gallons</p>
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
              {messages.length === 0 && (
                <p>Ask a question about {tank.name}'s tank!</p>
              )}
              {/* TODO: Render basic Markdown formatting such as **bold text**. */}
              {messages.map((chatMessage, index) => (
                <p key={`${chatMessage.sender}-${index}`}>
                  <strong>{chatMessage.sender}:</strong> {chatMessage.text}
                </p>
              ))}
              {isSending && <p>AquaGuard is thinking...</p>}
            </div>
            <form className="chat-form" onSubmit={handleChatSubmit}>
              <label htmlFor="chat-message">Message</label>
              <div className="chat-input-row">
                <input
                  id="chat-message"
                  name="message"
                  placeholder="Hows the tank doing?"
                  type="text"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>
              <div className="chat-input-send-button">
                <button type="submit" disabled={!message.trim() || isSending}>
                  {isSending ? "Sending..." : "Send"}
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
