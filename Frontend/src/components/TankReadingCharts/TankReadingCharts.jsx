import { LineChart } from "@mui/x-charts/LineChart";
import "./TankReadingCharts.css";

const chartDetails = [
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "ph", label: "pH", unit: "" },
  { key: "ammonia", label: "Ammonia", unit: "ppm" },
];

function TankReadingCharts({ readingHistory }) {
  const timeLabels = readingHistory.map((reading) =>
    new Date(reading.recordedAt).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }),
  );

  return (
    <section className="panel reading-history-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Current session</p>
          <h2>Readings History</h2>
        </div>
      </div>
      <div className="reading-chart-grid">
        {chartDetails.map((chart) => (
          <article className="reading-chart" key={chart.key}>
            <h3>
              {chart.label} {chart.unit && `(${chart.unit})`}
            </h3>
            <LineChart
              xAxis={[{ data: timeLabels, scaleType: "point" }]}
              series={[
                {
                  data: readingHistory.map((reading) => reading[chart.key]),
                  label: chart.label,
                  showMark: true,
                },
              ]}
              colors={["#1d7f88"]}
              height={220}
              margin={{ top: 16, right: 16, bottom: 30, left: 45 }}
              hideLegend
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export default TankReadingCharts;
