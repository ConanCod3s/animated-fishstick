const {FieldValue} = require("firebase-admin/firestore");
const {onUserCreated} = require("firebase-functions/v2/identity");
const {db} = require("../firebase");

const createUserProfile = onUserCreated(async (event) => {
  const user = event.data;

  await db.collection("users").doc(user.uid).set({
    email: user.email || "",
    approved: false,
    createdAt: FieldValue.serverTimestamp(),
  });
});

module.exports = {createUserProfile};

