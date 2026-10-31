import "./TankCard.css";

function TankCard({ currentUser, onSelect, tank }) {
  const isOwner = currentUser.email === tank.ownerEmail;
  const statusClass =
    tank.status === "Warning" ? "status-warning" : "status-normal";

  return (
    <article className="tank-card">
      <div className="tank-card-heading">
        <div>
          <p className="eyebrow">{tank.type}</p>
          <h2>{tank.name}</h2>
        </div>
        <span className={`status ${statusClass}`}>{tank.status}</span>
      </div>
      <dl className="tank-summary">
        <div>
          <dt>Size</dt>
          <dd>{tank.gallons} gallons</dd>
        </div>
        <div>
          <dt>Temperature</dt>
          <dd>{tank.temperature}°C</dd>
        </div>
        <div>
          <dt>pH</dt>
          <dd>{tank.ph}</dd>
        </div>
        <div>
          <dt>Ammonia</dt>
          <dd>{tank.ammonia} ppm</dd>
        </div>
      </dl>
      <button
        className="primary-button"
        type="button"
        onClick={() => onSelect(tank.id)}
      >
        {isOwner ? "Manage My Tank" : "View Tank"}
      </button>
    </article>
  );
}

export default TankCard;
