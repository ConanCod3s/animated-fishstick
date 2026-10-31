const { db } = require("../firebase");

/**
 * Checks whether an email is on the Firebase allowlist.
 * @param {string} email The email address to check.
 * @return {Promise<boolean>} True when the email is approved.
 */
async function validateUserEmail(email) {
  const normalizedEmail = email ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return false;
  }

  const matchingEmail = await db
    .collection("allowlist")
    .doc(normalizedEmail)
    .get();

  return matchingEmail.exists;
}

module.exports = { validateUserEmail };
