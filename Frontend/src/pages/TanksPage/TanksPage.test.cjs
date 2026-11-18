const { render, screen, waitFor } = require("@testing-library/react");
const userEvent = require("@testing-library/user-event").default;
const firestore = require("firebase/firestore");
const { db } = require("../../firebase/Config");
const TanksPage = require("./TanksPage.jsx").default;

const currentUser = { uid: "user-1", email: "keeper@example.com" };
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
  createdAt: { seconds: 1_700_000_000 },
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("shows tank details and selects a tank to manage", async () => {
  const user = userEvent.setup();
  const onSelectTank = jest.fn();
  render(
    <TanksPage
      currentUser={currentUser}
      onSelectTank={onSelectTank}
      onSignOut={jest.fn()}
      tanks={[tank]}
    />,
  );

  expect(screen.getByRole("heading", { name: "All tanks" })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Community Tank" }),
  ).toBeInTheDocument();
  expect(screen.getByText("55 gallons")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Manage My Tank" }));
  expect(onSelectTank).toHaveBeenCalledWith("tank-1");
});

test("adds a tank with numeric readings and the current owner", async () => {
  const user = userEvent.setup();
  firestore.addDoc.mockResolvedValueOnce({ id: "tank-2" });
  render(
    <TanksPage
      currentUser={currentUser}
      onSelectTank={jest.fn()}
      onSignOut={jest.fn()}
      tanks={[]}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Add Tank" }));
  await user.type(screen.getByLabelText("Tank Name"), "  Nano Tank  ");
  await user.type(screen.getByLabelText("Tank Type"), " Freshwater ");
  await user.type(screen.getByLabelText("Gallons"), "10");
  await user.type(screen.getByLabelText("Temperature (°F)"), "75.5");
  await user.type(screen.getByLabelText("pH"), "7.4");
  await user.type(screen.getByLabelText("Ammonia (ppm)"), "0.02");
  await user.click(screen.getByRole("button", { name: "Add Tank" }));

  await waitFor(() => {
    expect(firestore.addDoc).toHaveBeenCalledWith(
      { database: db, name: "tanks" },
      {
        name: "Nano Tank",
        type: "Freshwater",
        gallons: 10,
        temperature: 75.5,
        ph: 7.4,
        ammonia: 0.02,
        status: "Normal",
        ownerId: "user-1",
        createdAt: "server-timestamp",
      },
    );
  });
  expect(
    screen.queryByRole("heading", { name: "Add Tank", level: 2 }),
  ).not.toBeInTheDocument();
});

test("shows an empty state and reports a failed save", async () => {
  const user = userEvent.setup();
  firestore.addDoc.mockRejectedValueOnce(new Error("offline"));
  render(
    <TanksPage
      currentUser={currentUser}
      onSelectTank={jest.fn()}
      onSignOut={jest.fn()}
      tanks={[]}
    />,
  );

  expect(screen.getByText("No tanks yet.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Add Tank" }));
  await user.type(screen.getByLabelText("Tank Name"), "Nano Tank");
  await user.type(screen.getByLabelText("Tank Type"), "Freshwater");
  await user.type(screen.getByLabelText("Gallons"), "10");
  await user.type(screen.getByLabelText("Temperature (°F)"), "75");
  await user.type(screen.getByLabelText("pH"), "7");
  await user.type(screen.getByLabelText("Ammonia (ppm)"), "0");
  await user.click(screen.getByRole("button", { name: "Add Tank" }));

  expect(
    await screen.findByText("AquaGuard could not add this tank."),
  ).toBeInTheDocument();
});

test("switches to Celsius and still saves the temperature in Fahrenheit", async () => {
  const user = userEvent.setup();
  const { TemperatureUnitProvider } = require("../../utils/temperature.jsx");
  window.localStorage.clear();
  firestore.addDoc.mockResolvedValueOnce({ id: "tank-3" });
  render(
    <TemperatureUnitProvider>
      <TanksPage
        currentUser={currentUser}
        onSelectTank={jest.fn()}
        onSignOut={jest.fn()}
        tanks={[tank]}
      />
    </TemperatureUnitProvider>,
  );

  expect(screen.getByText("76°F")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "°C" }));
  expect(screen.getByRole("button", { name: "°C" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByText("24.4°C")).toBeInTheDocument();
  expect(window.localStorage.getItem("aquaguard.temperatureUnit")).toBe("C");

  await user.click(screen.getByRole("button", { name: "Add Tank" }));
  await user.type(screen.getByLabelText("Tank Name"), "Reef Tank");
  await user.type(screen.getByLabelText("Tank Type"), "Saltwater");
  await user.type(screen.getByLabelText("Gallons"), "40");
  await user.type(screen.getByLabelText("Temperature (°C)"), "25");
  await user.type(screen.getByLabelText("pH"), "8.2");
  await user.type(screen.getByLabelText("Ammonia (ppm)"), "0");
  await user.click(screen.getByRole("button", { name: "Add Tank" }));

  await waitFor(() => {
    expect(firestore.addDoc).toHaveBeenCalledWith(
      { database: db, name: "tanks" },
      expect.objectContaining({ name: "Reef Tank", temperature: 77 }),
    );
  });
  window.localStorage.clear();
});
