import { useEffect, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import AppHeader from "../../components/AppHeader/AppHeader";
import TankReadingCharts from "../../components/TankReadingCharts/TankReadingCharts";
import { db } from "../../firebase/Config";
import {
  AI_WORKER_URL,
  SIMULATION_INTERVAL_MS,
} from "../../utils/constants";
import "./TankDetailPage.css";

const readingFields = [
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "ph", label: "pH", unit: "" },
  { key: "ammonia", label: "Ammonia", unit: "ppm" },
];

function roundReading(value, decimals) {
  return Number(value.toFixed(decimals));
}

function createHistoryReading(tank) {
  return {
    temperature: tank.temperature,
    ph: tank.ph,
    ammonia: tank.ammonia,
    recordedAt: Date.now(),
  };
}

function getNormalReadings(tank) {
  return {
    temperature: roundReading(tank.temperature + (Math.random() - 0.5) * 0.4, 1),
    ph: roundReading(Math.max(0, Math.min(14, tank.ph + (Math.random() - 0.5) * 0.2)), 1),
    ammonia: roundReading(Math.max(0, tank.ammonia + (Math.random() - 0.5) * 0.02), 2),
    status: "Normal",
  };
}

function getAnomalyReadings(tank) {
  const anomalies = [
    {
      temperature: roundReading(tank.temperature + 5, 1),
      status: "Warning",
    },
    {
      ph: roundReading(Math.min(14, tank.ph + 1), 1),
      status: "Warning",
    },
    {
      ammonia: roundReading(Math.max(0.5, tank.ammonia + 0.5), 2),
      status: "Warning",
    },
  ];

  return anomalies[Math.floor(Math.random() * anomalies.length)];
}

function TankDetailPage({ currentUser, onBack, onSignOut, tank }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isUpdatingTank, setIsUpdatingTank] = useState(false);
  const [simulationError, setSimulationError] = useState("");
  const [readingHistory, setReadingHistory] = useState([
    createHistoryReading(tank),
  ]);
  const intervalRef = useRef(null);
  const tankRef = useRef(tank);
  const baselineReadingsRef = useRef(null);
  const isOwner = currentUser.uid === tank.ownerId;
  const statusClass =
    tank.status === "Warning" ? "status-warning" : "status-normal";

  useEffect(() => {
    tankRef.current = tank;
  }, [tank]);

  useEffect(() => {
    return () => window.clearInterval(intervalRef.current);
  }, []);

  async function updateTankReadings(forceAnomaly = false) {
    if (isUpdatingTank) {
      return;
    }

    setIsUpdatingTank(true);
    setSimulationError("");

    try {
      const currentTank = tankRef.current;
      const hasAnomaly = forceAnomaly || Math.random() < 0.05;
      const readings = hasAnomaly
        ? getAnomalyReadings(currentTank)
        : getNormalReadings(baselineReadingsRef.current || currentTank);

      await updateDoc(doc(db, "tanks", currentTank.id), readings);
      setReadingHistory((currentHistory) => [
        ...currentHistory.slice(-19),
        createHistoryReading({ ...currentTank, ...readings }),
      ]);
    } catch {
      setSimulationError("AquaGuard could not update this tank.");
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsSimulating(false);
    } finally {
      setIsUpdatingTank(false);
    }
  }

  function handleStartSimulation() {
    if (intervalRef.current) {
      return;
    }

    baselineReadingsRef.current = {
      temperature: tank.temperature,
      ph: tank.ph,
      ammonia: tank.ammonia,
    };
    intervalRef.current = window.setInterval(
      updateTankReadings,
      SIMULATION_INTERVAL_MS,
    );
    setIsSimulating(true);
    setSimulationError("");
  }

  function handleStopSimulation() {
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsSimulating(false);
  }

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
          <div>
          <section className="panel owner-panel">
            <div>
              <h2>Run simulations</h2>
            </div>
            <div className="owner-actions">
              <button
                className="primary-button"
                disabled={isSimulating}
                type="button"
                onClick={handleStartSimulation}
              >
                Start
              </button>
              <button
                className="secondary-button"
                disabled={!isSimulating}
                type="button"
                onClick={handleStopSimulation}
              >
                Stop
              </button>
              <button
                className="warning-button"
                disabled={isUpdatingTank}
                type="button"
                onClick={() => updateTankReadings(true)}
              >
                Inject anomaly
              </button>
            </div>
          </section>
            <p className="simulation-status">
              {simulationError ||
                (isSimulating ? "Simulation is running." : "Simulation is stopped.")}
            </p>
          <TankReadingCharts readingHistory={readingHistory} />
          </div>
        )}
      </main>
    </div>
  );
}

export default TankDetailPage;
