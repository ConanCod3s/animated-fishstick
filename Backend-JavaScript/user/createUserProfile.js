const {onUserCreated} = require("firebase-functions/v2/identity");
const {getAuth} = require("firebase-admin/auth");
const {FieldValue} = require("firebase-admin/firestore");
const {db} = require("../firebase");
const {validateUserEmail} = require("./validateUserEmail");

const createUserProfile = onUserCreated(async (event) => {
  const user = event.data;
  const isAllowed = await validateUserEmail(user.email);

  if (!isAllowed) {
    await getAuth().deleteUser(user.uid);
    return;
  }

  await db.collection("users").doc(user.uid).set({
    email: user.email || "",
    approved: true,
    createdAt: FieldValue.serverTimestamp(),
  });
});

module.exports = {createUserProfile};

