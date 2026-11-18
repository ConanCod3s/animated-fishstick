import {
  toDisplayTemperature,
  useTemperatureUnit,
} from "../../../utils/temperature";

function Ticketbox({ ticket, loading = false, error = "" }) {
  const { unit, symbol } = useTemperatureUnit();
  if (error) return <p role="alert">{error}</p>;
  if (!ticket && loading)
    return <p role="status">Loading ticket information...</p>;
  if (!ticket) return <p>No tickets are available for this tank.</p>;
  const createdAt = ticket.createdAt?.toDate
    ? ticket.createdAt.toDate()
    : new Date(ticket.createdAt);

  const toUpperCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  console.log("Ticketbox ticket:", ticket);
  return (
    <article className="ticket-information">
      <h3>Ticket {ticket.id || ticket.tankId}</h3>
      <p>
        <strong>Status:</strong> {toUpperCase(ticket.status)}
      </p>
      <p>
        <strong>Tank:</strong> {ticket.tankName}
      </p>
      <p>
        <strong>Requested by:</strong>{" "}
        {ticket.requestedByDisplayName || ticket.requestedBy}
      </p>
      {!Number.isNaN(createdAt.getTime()) && (
        <p>
          <strong>Created:</strong> {createdAt.toLocaleString()}
        </p>
      )}
      <p>
        <strong>Question:</strong> {ticket.question}
      </p>
      {ticket.aiResponse && (
        <p>
          <strong>AI response:</strong> {ticket.aiResponse}
        </p>
      )}
      <p>
        <strong>Reason for escalation:</strong> {ticket.reason}
      </p>
      {ticket.readings && (
        <p>
          <strong>Readings when escalated:</strong>
          <br />
          {`Temperature: ${toDisplayTemperature(ticket.readings.temperature, unit)} ${symbol}`}
          <br />
          {`pH: ${ticket.readings.ph}`}
          <br />
          {`Ammonia: ${ticket.readings.ammonia} ppm`}
        </p>
      )}
    </article>
  );
}

export default Ticketbox;
