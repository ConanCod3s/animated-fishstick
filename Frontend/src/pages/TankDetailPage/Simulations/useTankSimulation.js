import { useEffect, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/Config";
import { SIMULATION_INTERVAL_MS } from "../../../utils/constants";

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
    temperature: roundReading(
      tank.temperature + (Math.random() - 0.5) * 0.4,
      1,
    ),
    ph: roundReading(
      Math.max(0, Math.min(14, tank.ph + (Math.random() - 0.5) * 0.2)),
      1,
    ),
    ammonia: roundReading(
      Math.max(0, tank.ammonia + (Math.random() - 0.5) * 0.02),
      2,
    ),
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

function useTankSimulation(tank) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [secondsUntilUpdate, setSecondsUntilUpdate] = useState(
    Math.ceil(SIMULATION_INTERVAL_MS / 1000),
  );
  const [isUpdatingTank, setIsUpdatingTank] = useState(false);
  const [simulationError, setSimulationError] = useState("");
  const [readingHistory, setReadingHistory] = useState([
    createHistoryReading(tank),
  ]);
  const intervalRef = useRef(null);
  const nextUpdateAtRef = useRef(0);
  const tankRef = useRef(tank);
  const baselineReadingsRef = useRef(null);
  const updateInProgressRef = useRef(false);

  useEffect(() => {
    tankRef.current = tank;
  }, [tank]);

  useEffect(() => {
    return () => window.clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isSimulating) {
      return undefined;
    }

    const countdown = window.setInterval(() => {
      setSecondsUntilUpdate(
        Math.max(0, Math.ceil((nextUpdateAtRef.current - Date.now()) / 1000)),
      );
    }, 250);

    return () => window.clearInterval(countdown);
  }, [isSimulating]);

  async function updateTankReadings(forceAnomaly = false) {
    if (updateInProgressRef.current) {
      return;
    }

    updateInProgressRef.current = true;
    setIsUpdatingTank(true);
    setSimulationError("");

    try {
      const currentTank = tankRef.current;
      const baseline = currentTank.simulationBaseline ||
        baselineReadingsRef.current || {
          temperature: currentTank.temperature,
          ph: currentTank.ph,
          ammonia: currentTank.ammonia,
        };
      baselineReadingsRef.current = baseline;
      const hasAnomaly = forceAnomaly || Math.random() < 0.05;
      const readings = hasAnomaly
        ? getAnomalyReadings(currentTank)
        : getNormalReadings(baseline);

      await updateDoc(doc(db, "tanks", currentTank.id), {
        ...readings,
        simulationBaseline: baseline,
        warningPending: hasAnomaly
          ? true
          : (currentTank.warningPending ?? currentTank.status === "Warning"),
      });
      tankRef.current = {
        ...currentTank,
        ...readings,
        simulationBaseline: baseline,
      };
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
      updateInProgressRef.current = false;
      setIsUpdatingTank(false);
    }
  }

  function handleStartSimulation() {
    if (intervalRef.current) {
      return;
    }

    baselineReadingsRef.current = tank.simulationBaseline ||
      baselineReadingsRef.current || {
        temperature: tank.temperature,
        ph: tank.ph,
        ammonia: tank.ammonia,
      };
    nextUpdateAtRef.current = Date.now() + SIMULATION_INTERVAL_MS;
    setSecondsUntilUpdate(Math.ceil(SIMULATION_INTERVAL_MS / 1000));
    intervalRef.current = window.setInterval(() => {
      nextUpdateAtRef.current = Date.now() + SIMULATION_INTERVAL_MS;
      setSecondsUntilUpdate(Math.ceil(SIMULATION_INTERVAL_MS / 1000));
      updateTankReadings();
    }, SIMULATION_INTERVAL_MS);
    setIsSimulating(true);
    setSimulationError("");
  }

  function handleStopSimulation() {
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsSimulating(false);
  }

  async function handleResetSimulation() {
    if (updateInProgressRef.current) {
      return;
    }

    handleStopSimulation();
    const currentTank = tankRef.current;
    const baseline =
      currentTank.simulationBaseline || baselineReadingsRef.current;
    if (!baseline) {
      return;
    }

    updateInProgressRef.current = true;
    setIsUpdatingTank(true);
    setSimulationError("");
    try {
      const readings = { ...baseline, status: "Normal" };
      await updateDoc(doc(db, "tanks", currentTank.id), readings);
      tankRef.current = { ...currentTank, ...readings };
      setReadingHistory([createHistoryReading(readings)]);
    } catch {
      setSimulationError("AquaGuard could not reset this tank.");
    } finally {
      updateInProgressRef.current = false;
      setIsUpdatingTank(false);
    }
  }

  return {
    isSimulating,
    secondsUntilUpdate,
    isUpdatingTank,
    simulationError,
    readingHistory,
    handleStartSimulation,
    handleStopSimulation,
    handleResetSimulation,
    updateTankReadings,
  };
}

export default useTankSimulation;
