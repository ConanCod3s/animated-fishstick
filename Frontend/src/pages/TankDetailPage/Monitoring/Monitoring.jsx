import {
  toDisplayTemperature,
  useTemperatureUnit,
} from "../../../utils/temperature";

const readingFields = [
  { key: "temperature", label: "Temperature", isTemperature: true },
  { key: "ph", label: "pH", unit: "" },
  { key: "ammonia", label: "Ammonia", unit: "ppm" },
];

function Monitoring({ tank }) {
  const { unit, symbol } = useTemperatureUnit();
  return (
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
            <strong>
              {reading.isTemperature
                ? toDisplayTemperature(tank[reading.key], unit)
                : tank[reading.key]}
            </strong>
            <span>{reading.isTemperature ? symbol : reading.unit}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
export default Monitoring;
