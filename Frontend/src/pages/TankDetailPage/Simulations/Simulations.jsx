import TankReadingCharts from "../../../components/TankReadingCharts/TankReadingCharts";
import useTankSimulation from "./useTankSimulation";

function Simulations({ tank }) {
  const {
    isSimulating,
    secondsUntilUpdate,
    isUpdatingTank,
    simulationError,
    readingHistory,
    handleStartSimulation,
    handleStopSimulation,
    handleResetSimulation,
    updateTankReadings,
  } = useTankSimulation(tank);
  return (
    <div>
      <section className="panel owner-panel">
        <div>
          <h2>Run simulations</h2>
          <p className="simulation-status">
            {simulationError ||
              (isSimulating
                ? `Simulation is running. Next update in ${secondsUntilUpdate}s.`
                : "Simulation is stopped.")}
          </p>
        </div>
        <div className="owner-actions">
          <button
            className="primary-button"
            disabled={isSimulating || isUpdatingTank}
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
            className="secondary-button"
            disabled={isUpdatingTank || !tank.simulationBaseline}
            type="button"
            onClick={handleResetSimulation}
          >
            Reset
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

      <TankReadingCharts readingHistory={readingHistory} />
    </div>
  );
}
export default Simulations;
