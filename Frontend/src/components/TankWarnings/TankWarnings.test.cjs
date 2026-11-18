// Use the same tank and warning so only the viewer's ownership changes.

const { fireEvent, render, screen, waitFor, within } = require("@testing-library/react");

jest.mock("firebase/firestore", () => ({
  db: {},
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

const { doc, updateDoc } = require("firebase/firestore");
const { db } = require("../../firebase/Config");
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

test("requests a warning clear when the tank owner clicks Clear", async () => {
  const tankDocument = { id: tank.id };
  doc.mockReturnValueOnce(tankDocument);
  updateDoc.mockResolvedValueOnce(undefined);

  render(<TankWarnings tanks={[tank]} currentUser={{ uid: tank.ownerId }} />);

  fireEvent.click(screen.getByRole("button", { name: "Clear" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
  });

  expect(doc).toHaveBeenCalledWith(db, "tanks", tank.id);
  expect(updateDoc).toHaveBeenCalledWith(tankDocument, {
    warningPending: false,
  });
});