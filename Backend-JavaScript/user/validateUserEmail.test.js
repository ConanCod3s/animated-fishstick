
jest.mock("../firebase", () => ({
  db: {
    collection: jest.fn(),
  },
}));

const { db } = require("../firebase");
const { validateUserEmail } = require("./validateUserEmail");

describe("validateUserEmail", () => {
  let getMock;
  let docMock;

  beforeEach(() => {
    jest.clearAllMocks();

    getMock = jest.fn();
    docMock = jest.fn(() => ({
      get: getMock,
    }));

    db.collection.mockReturnValue({
      doc: docMock,
    });
  });

  test("accepts an approved email", async () => {
    getMock.mockResolvedValue({ exists: true });

    const result = await validateUserEmail(
      "approved@example.com"
    );

    expect(result).toBe(true);
    expect(db.collection).toHaveBeenCalledWith(
      "allowlist"
    );
    expect(docMock).toHaveBeenCalledWith(
      "approved@example.com"
    );
  });

  test("rejects an unapproved email", async () => {
    getMock.mockResolvedValue({ exists: false });

    const result = await validateUserEmail(
      "unknown@example.com"
    );

    expect(result).toBe(false);
  });

  test("normalizes uppercase emails", async () => {
    getMock.mockResolvedValue({ exists: true });

    await validateUserEmail("TEST@EXAMPLE.COM");

    expect(docMock).toHaveBeenCalledWith(
      "test@example.com"
    );
  });

  test("removes surrounding whitespace", async () => {
    getMock.mockResolvedValue({ exists: true });

    await validateUserEmail("  test@example.com  ");

    expect(docMock).toHaveBeenCalledWith(
      "test@example.com"
    );
  });

  test("rejects an empty email", async () => {
    const result = await validateUserEmail("");

    expect(result).toBe(false);
    expect(db.collection).not.toHaveBeenCalled();
  });

  test("rejects a null email", async () => {
    const result = await validateUserEmail(null);

    expect(result).toBe(false);
    expect(db.collection).not.toHaveBeenCalled();
  });

  test("propagates Firestore errors", async () => {
    getMock.mockRejectedValue(
      new Error("Firestore unavailable")
    );

    await expect(
      validateUserEmail("test@example.com")
    ).rejects.toThrow("Firestore unavailable");
  });
});
