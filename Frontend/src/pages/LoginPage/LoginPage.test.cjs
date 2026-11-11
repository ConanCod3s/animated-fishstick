const { render, screen, waitFor } = require("@testing-library/react");
const userEvent = require("@testing-library/user-event").default;
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} = require("firebase/auth");
const LoginPage = require("./LoginPage.jsx").default;

beforeEach(() => {
  jest.clearAllMocks();
});

test("signs in with a trimmed, lower-case email", async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  await user.type(screen.getByLabelText("Email"), "  FISHKEEPER@EXAMPLE.COM  ");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  await waitFor(() => {
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      "fishkeeper@example.com",
      "password123",
    );
  });
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
});

test("switches to account creation and shows a useful auth error", async () => {
  const user = userEvent.setup();
  createUserWithEmailAndPassword.mockRejectedValueOnce({
    code: "auth/email-already-in-use",
  });
  render(<LoginPage />);

  await user.click(screen.getByRole("button", { name: "New User? Sign Up" }));
  expect(
    screen.getByText("Create an account to use AquaGuard."),
  ).toBeInTheDocument();

  await user.type(screen.getByLabelText("Email"), "fishkeeper@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(
    await screen.findByText("An account already exists for this email."),
  ).toBeInTheDocument();
  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
    {},
    "fishkeeper@example.com",
    "password123",
  );
});

test("displays an auth error provided by the parent", () => {
  render(<LoginPage errorMessage="This email is not approved for AquaGuard." />);

  expect(
    screen.getByText("This email is not approved for AquaGuard."),
  ).toBeInTheDocument();
});
