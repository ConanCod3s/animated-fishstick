// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyJPMvtta_7klQILumUq-Gkbo5g1VeuLI",
  authDomain: "animated-fishstick.firebaseapp.com",
  databaseURL: "https://animated-fishstick-default-rtdb.firebaseio.com",
  projectId: "animated-fishstick",
  storageBucket: "animated-fishstick.firebasestorage.app",
  messagingSenderId: "921584299659",
  appId: "1:921584299659:web:66dafabaa706ca753bae8e",
  measurementId: "G-5ZNJKCBML0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const analytics = getAnalytics(app);

export { app, auth };
