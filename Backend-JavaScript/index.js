const { setGlobalOptions } = require("firebase-functions");
const { createUserProfile } = require("./user/createUserProfile");

setGlobalOptions({ maxInstances: 5 });

exports.createUserProfile = createUserProfile;
