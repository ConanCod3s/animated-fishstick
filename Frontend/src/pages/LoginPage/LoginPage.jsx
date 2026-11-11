import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../firebase/Config";
import { APP_NAME } from "../../utils/constants";
import "./LoginPage.css";

function LoginPage({ errorMessage }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const emailAddress = email.trim().toLowerCase();
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, emailAddress, password);
      } else {
        await signInWithEmailAndPassword(auth, emailAddress, password);
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError.code));
    } finally {
      setIsLoading(false);
    }
  }

  function getAuthErrorMessage(errorCode) {
    if (errorCode.includes("invalid-credential")) {
      return "The email or password is incorrect.";
    }
    if (errorCode.includes("email-already-in-use")) {
      return "An account already exists for this email.";
    }
    if (errorCode.includes("weak-password")) {
      return "Use a password with at least six characters.";
    }
    if (errorCode.includes("invalid-email")) {
      return "Enter a valid email address.";
    }
    return "Something went wrong. Please try again.";
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
            {isSignUp
              ? "Create an account to use AquaGuard."
              : "Sign in to view aquariums and manage your tank."}
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
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {(error || errorMessage) && (
            <p className="login-error">{error || errorMessage}</p>
          )}
          <button disabled={isLoading} type="submit">
            {isLoading ? "Please wait..." : isSignUp ? "Sign up" : "Sign in"}
          </button>
        </form>
        <button
          className="login-toggle"
          type="button"
          onClick={() => {
            setError("");
            setIsSignUp(!isSignUp);
          }}
        >
          {isSignUp ? "Have an account? Sign in" : "New User? Sign Up"}
        </button>
      </section>
    </main>
  );
}

export default LoginPage;
