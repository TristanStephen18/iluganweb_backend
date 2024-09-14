import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
const db = getFirestore(app);

const logoutbtn = document.querySelector("#logout");

logoutbtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Log out successful");
      window.location.assign("login.html");
    })
    .catch((error) => {
      Swal.fire({
        title: "ERROR!!!",
        text: error.message,
        icon: "error",
      });
    });
});

const map = document.querySelector("#map");

function checkuser() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is logged in:", user.uid);
      getUserData(user.uid);
    } else {
      console.log("No user is signed in.");
      window.location.assign("login.html");
    }
  });
}

function addMarkerToMap(lat, lng) {
  const marker = document.createElement("gmp-advanced-marker");
  marker.setAttribute("position", `${lat},${lng}`);
  marker.setAttribute("title", "Terminal Location");
  map.setAttribute("center", `${lat},${lng}`);
  map.appendChild(marker);
}

async function getUserData(uid) {
  try {
    const docRef = doc(db, "companies", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const location = data.terminal_location;
      if (location) {
        const lat = location.latitude;
        const lng = location.longitude;

        addMarkerToMap(lat, lng);

        console.log("Location:", lat, lng);
      } else {
        console.log("No terminal location found");
      }
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error fetching document: ", error);
  }
}

window.onload = checkuser();

const mfbtn = document.querySelector("#fleetbtn");

mfbtn.addEventListener("click", () => {
  window.location.assign("fleetmanagement.html");
});
