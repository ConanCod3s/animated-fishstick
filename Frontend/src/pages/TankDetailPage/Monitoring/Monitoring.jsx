const readingFields = [
  { key: "temperature", label: "Temperature", unit: "°F" },
  { key: "ph", label: "pH", unit: "" },
  { key: "ammonia", label: "Ammonia", unit: "ppm" },
];

function Monitoring({ tank }) {
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
            <strong>{tank[reading.key]}</strong>
            <span>{reading.unit}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
export default Monitoring;
