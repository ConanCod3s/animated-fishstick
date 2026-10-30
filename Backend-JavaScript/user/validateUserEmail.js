const {db} = require("../firebase");

async function validateUserEmail(email) {
  const normalizedEmail = email ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return false;
  }

  const matchingEmail = await db
      .collection("whiteList")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

  return !matchingEmail.empty;
}

module.exports = {validateUserEmail};


