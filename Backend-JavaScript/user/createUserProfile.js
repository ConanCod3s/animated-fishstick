const {beforeUserCreated} = require("firebase-functions/v2/identity");
const {HttpsError} = require("firebase-functions/v2/https");
const {FieldValue} = require("firebase-admin/firestore");
const {db} = require("../firebase");
const {validateUserEmail} = require("./validateUserEmail");

const createUserProfile = beforeUserCreated(async (event) => {
  const user = event.data;
  const isAllowed = await validateUserEmail(user.email);

  if (!isAllowed) {
    throw new HttpsError(
        "permission-denied",
        "This email is not approved for AquaGuard.",
    );
  }

  await db.collection("users").doc(user.uid).set({
    email: user.email || "",
    approved: true,
    createdAt: FieldValue.serverTimestamp(),
  });
});

module.exports = {createUserProfile};

