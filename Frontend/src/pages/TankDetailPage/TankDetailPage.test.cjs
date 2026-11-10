const { render, screen, waitFor } = require("@testing-library/react");
const userEvent = require("@testing-library/user-event").default;
const firestore = require("firebase/firestore");
const { db } = require("../../firebase/Config");
const TankDetailPage = require("./TankDetailPage.jsx").default;

const currentUser = {
  uid: "user-1",
  email: "keeper@example.com",
  getIdToken: jest.fn().mockResolvedValue("user-token"),
};
const tank = {
  id: "tank-1",
  name: "Community Tank",
  type: "Freshwater",
  gallons: 55,
  temperature: 76,
  ph: 7.2,
  ammonia: 0.1,
  status: "Normal",
  ownerId: "user-1",
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

test("shows readings and owner-only simulation controls", () => {
  render(
    <TankDetailPage
      currentUser={currentUser}
      onBack={jest.fn()}
      onSignOut={jest.fn()}
      tank={tank}
    />,
  );

  expect(
    screen.getByRole("heading", { name: "Community Tank" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Live Readings" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Temperature")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Inject anomaly" }),
  ).toBeInTheDocument();
});

test("sends a trimmed chat prompt and renders the mocked AI response", async () => {
  const user = userEvent.setup();
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ response: "Your water looks stable." }),
  });
  render(
    <TankDetailPage
      currentUser={currentUser}
      onBack={jest.fn()}
      onSignOut={jest.fn()}
      tank={tank}
    />,
  );

  await user.type(screen.getByLabelText("Message"), "  Is my tank healthy?  ");
  await user.click(screen.getByRole("button", { name: "Send" }));

  expect(
    await screen.findByText("Your water looks stable."),
  ).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:8787/chat",
    expect.objectContaining({
      method: "POST",
      headers: {
        Authorization: "Bearer user-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Is my tank healthy?",
        tank: {
          id: "tank-1",
          name: "Community Tank",
          type: "Freshwater",
          gallons: 55,
          status: "Normal",
          temperature: 76,
          ph: 7.2,
          ammonia: 0.1,
        },
      }),
    }),
  );
});

test("shows the worker error and does not send an empty chat message", async () => {
  const user = userEvent.setup();
  global.fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: "User is not approved" }),
  });
  render(
    <TankDetailPage
      currentUser={currentUser}
      onBack={jest.fn()}
      onSignOut={jest.fn()}
      tank={tank}
    />,
  );

  expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  await user.type(screen.getByLabelText("Message"), "Check my readings");
  await user.click(screen.getByRole("button", { name: "Send" }));

  expect(await screen.findByText("User is not approved")).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("shows a network error from the mocked AI request", async () => {
  const user = userEvent.setup();
  global.fetch.mockRejectedValueOnce(new Error("Network unavailable"));
  render(
    <TankDetailPage
      currentUser={currentUser}
      onBack={jest.fn()}
      onSignOut={jest.fn()}
      tank={tank}
    />,
  );

  await user.type(screen.getByLabelText("Message"), "Check my readings");
  await user.click(screen.getByRole("button", { name: "Send" }));

  expect(await screen.findByText("Network unavailable")).toBeInTheDocument();
});

test("injects an anomaly and lets a non-owner return without simulation controls", async () => {
  const user = userEvent.setup();
  const onBack = jest.fn();
  const { rerender } = render(
    <TankDetailPage
      currentUser={currentUser}
      onBack={onBack}
      onSignOut={jest.fn()}
      tank={tank}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Inject anomaly" }));
  await waitFor(() => {
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      { database: db, collectionName: "tanks", id: "tank-1" },
      expect.objectContaining({ status: "Warning" }),
    );
  });

  rerender(
    <TankDetailPage
      currentUser={{ ...currentUser, uid: "user-2" }}
      onBack={onBack}
      onSignOut={jest.fn()}
      tank={tank}
    />,
  );
  expect(
    screen.queryByRole("button", { name: "Inject anomaly" }),
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: /Return to All Tanks/ }),
  );
  expect(onBack).toHaveBeenCalled();
});
