const mockDeleteUser = jest.fn();
const mockSet = jest.fn();
const mockDoc = jest.fn(() => ({ set: mockSet }));
const mockCollection = jest.fn(() => ({ doc: mockDoc }));
const mockValidateUserEmail = jest.fn();
const mockServerTimestamp = jest.fn(() => "mock-timestamp");

jest.mock("firebase-functions/v2/identity", () => ({
    onUserCreated: (handler) => handler,
}));

jest.mock("firebase-admin/auth", () => ({
    getAuth: () => ({
        deleteUser: mockDeleteUser,
    }),
}));

jest.mock("firebase-admin/firestore", () => ({
    FieldValue: {
        serverTimestamp: mockServerTimestamp,
    },
}));

jest.mock("../firebase", () => ({
    db: {
        collection: mockCollection,
    },
}));

jest.mock("./validateUserEmail", () => ({
    validateUserEmail: mockValidateUserEmail,
}));

const { createUserProfile } = require("./createUserProfile");

describe("createUserProfile", () => {
    const user = {
        uid: "test-user-001",
        email: "test@example.com",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSet.mockResolvedValue(undefined);
        mockDeleteUser.mockResolvedValue(undefined);
    });

    test("creates a profile for an approved user", async () => {
        mockValidateUserEmail.mockResolvedValue(true);

        await createUserProfile({ data: user });

        expect(mockValidateUserEmail).toHaveBeenCalledWith(user.email);
        expect(mockCollection).toHaveBeenCalledWith("users");
        expect(mockDoc).toHaveBeenCalledWith(user.uid);
        expect(mockSet).toHaveBeenCalledWith({
            email: user.email,
            displayName: user.email,
            approved: true,
            createdAt: "mock-timestamp",
        });
    });

    test("deletes an unapproved user's account", async () => {
        mockValidateUserEmail.mockResolvedValue(false);

        await createUserProfile({ data: user });

        expect(mockDeleteUser).toHaveBeenCalledWith(user.uid);
        expect(mockSet).not.toHaveBeenCalled();
    });

    test("does not delete an approved user", async () => {
        mockValidateUserEmail.mockResolvedValue(true);

        await createUserProfile({ data: user });

        expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    test("uses an empty display name when email is missing", async () => {
        mockValidateUserEmail.mockResolvedValue(true);

        await createUserProfile({
            data: { uid: "test-user-002" },
        });

        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "",
                displayName: "",
            })
        );
    });

    test("propagates errors from email validation", async () => {
        mockValidateUserEmail.mockRejectedValue(
            new Error("Firestore unavailable")
        );

        await expect(
            createUserProfile({ data: user })
        ).rejects.toThrow("Firestore unavailable");

        expect(mockSet).not.toHaveBeenCalled();
        expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    test("propagates errors when profile creation fails", async () => {
        mockValidateUserEmail.mockResolvedValue(true);
        mockSet.mockRejectedValue(new Error("Write failed"));

        await expect(
            createUserProfile({ data: user })
        ).rejects.toThrow("Write failed");
    });

    test("propagates errors when account deletion fails", async () => {
        mockValidateUserEmail.mockResolvedValue(false);
        mockDeleteUser.mockRejectedValue(
            new Error("Deletion failed")
        );

        await expect(
            createUserProfile({ data: user })
        ).rejects.toThrow("Deletion failed");

        expect(mockSet).not.toHaveBeenCalled();
    });
});
