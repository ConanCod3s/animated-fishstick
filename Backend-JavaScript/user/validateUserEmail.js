const {db} = require("../firebase");

/**
 * Checks whether an email is on the Firebase whitelist.
 * @param {string} email The email address to check.
 * @return {Promise<boolean>} True when the email is approved.
 */
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
