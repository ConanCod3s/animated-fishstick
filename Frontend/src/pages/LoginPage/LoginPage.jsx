import { useState } from "react";
import { APP_NAME } from "../../utils/constants";
import "./LoginPage.css";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onLogin({ email: email.trim().toLowerCase() });
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div
          style={{
            textAlign: "center",
          }}
        >
          <p className="eyebrow">Aquarium monitoring</p>
          <h1>{APP_NAME}</h1>
          <p className="login-intro">
            Sign in to view aquariums and manage your tank.
          </p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <p
            style={{
              color: "red",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            DEV PURPOSE ONLY - Password accepts ANY non empty text
          </p>
          <button type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
