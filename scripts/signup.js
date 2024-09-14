import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAL0I2_e4RNhtnwavuNrncD21sZAsmslmY",
  authDomain: "ilugan-database.firebaseapp.com",
  projectId: "ilugan-database",
  storageBucket: "ilugan-database.appspot.com",
  messagingSenderId: "814689984399",
  appId: "1:814689984399:web:ec6e6715f77d754a6875fa",
  measurementId: "G-XD470CX22M",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

import {
  getFirestore,
  setDoc,
  doc,
  GeoPoint,
} from "https://www.gstatic.com/firebasejs/10.13/firebase-firestore.js";

const db = getFirestore();

const snpform = document.querySelector("#signup-form");

snpform.addEventListener("submit", (e) => {
  e.preventDefault();

  if (selectedLat == null && selectedLng == null) {
    Swal.fire({
      title: "Oopppss",
      text: "Select a location of your terminal first",
      icon: "error",
      confirmButtonText: "OK",
    });
  } else {
    const email = snpform["email"].value;
    const password = snpform["password"].value;
    const company = snpform["company"].value;

    async function addData(id, mail, pass, comp, lat, long) {
      try {
        const location = new GeoPoint(lat, long);
        await setDoc(doc(db, "companies", id), {
          company_name: comp,
          terminal_location: location,
          email: mail,
          password: pass,
        });
        alert("Account Created Successfully");
        window.location.assign("login.html");
      } catch (error) {
        console.error("Error writing document: ", error);
      }
    }


    createUserWithEmailAndPassword(auth, email, password)
      .then((cred) => {
        addData(
          cred.user.uid,
          email,
          password,
          company,
          selectedLat,
          selectedLng
        );
      })
      .catch((error) => {
        Swal.fire({
          title: "Error creating your account",
          text: error.message,
          icon: "error",
          confirmButtonText: "OK",
        });
      });
  }
});
