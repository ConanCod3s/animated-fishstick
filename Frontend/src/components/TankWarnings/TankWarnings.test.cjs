// Use the same tank and warning so only the viewer's ownership changes.

const { render, screen, within } = require("@testing-library/react");
const TankWarnings = require("./TankWarnings.jsx").default;

const tank = {
  id: "tank-1",
  name: "Community Tank",
  ownerId: "tank-owner",
  warningPending: true,
};

test.each([
  ["the tank owner", "tank-owner", true],
  ["another user", "tank-viewer", false],
])("shows the warning to %s with the expected Clear button", (_, uid, canClear) => {
  render(<TankWarnings tanks={[tank]} currentUser={{ uid }} />);

  const warning = within(screen.getByRole("region", { name: "Tank warnings" }));
  expect(
    warning.getByText(/Community Tank: Unusual tank reading/),
  ).toBeInTheDocument();

  const clearButton = warning.queryByRole("button", { name: "Clear" });
  if (canClear) {
    expect(clearButton).toBeEnabled();
  } else {
    expect(clearButton).not.toBeInTheDocument();
  }
});