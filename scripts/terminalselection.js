import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  updateDoc,
  GeoPoint,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAL0I2_e4RNhtnwavuNrncD21sZAsmslmY",
  authDomain: "ilugan-database.firebaseapp.com",
  projectId: "ilugan-database",
  storageBucket: "ilugan-database.appspot.com",
  messagingSenderId: "814689984399",
  appId: "1:814689984399:web:ec6e6715f77d754a6875fa",
  measurementId: "G-XD470CX22M",
};

// Firebase Initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// const database = getDatabase(app);

// let address = document.getElementById("location-info").textContent;
let coordinates;

document.getElementById("confirm-button").addEventListener("click", async () => {
    coordinates = await getCoordinates(document.getElementById("location-info").textContent); // Await here
    if (coordinates) {
      console.log(coordinates);
      alert(`Location confirmed: ${document.getElementById("location-info").textContent}`);
      await addterminaldata();
      document.getElementById("confirm-button").style.display = "none";
    } else {
      console.log("Coordinates could not be retrieved.");
      alert("Failed to retrieve location coordinates.");
    }
  });
  

let currentuserid;

function checkuser() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is logged in:", user.uid);
      // getUserData(user.uid);
      currentuserid = user.uid;
    } else {
      console.log("No user is signed in.");
      window.location.assign("login.html");
    }
  });
}

async function addterminaldata() {
  if (!currentuserid || !coordinates) {
    console.log("Missing user ID or coordinates.");
    return;
  }

  try {
    await updateDoc(doc(db, "companies", currentuserid), {
      terminal: document.getElementById("location-info").textContent,
      terminal_location: new GeoPoint(coordinates.lat, coordinates.lon), // Using GeoPoint with coordinates
    });
    console.log("Document successfully updated with terminal data.");
  } catch (error) {
    console.log(`Error updating document: ${error.message}`);
  }
}

async function getCoordinates(address) {
  const apiKey = "pk.b1172a5bd0a53f7260d0cca6f5ebb71a"; // Replace with your actual API key
  const encodedAddress = encodeURIComponent(address);
  const url = `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodedAddress}&format=json`;

  console.log("Fetching response from API");

  try {
    const response = await fetch(url);

    if (response.ok) {
      // Check if status code is 200-299
      const data = await response.json();

      // Access the first result in the array
      if (Array.isArray(data) && data.length > 0) {
        const firstResult = data[0];
        const coordinates = {
          lat: parseFloat(firstResult.lat),
          lon: parseFloat(firstResult.lon),
        };
        console.log(coordinates);
        return coordinates;
      } else {
        console.log("No results found for the address.");
        return null;
      }
    } else {
      console.log(`Error: Received status code ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log(`Error fetching address: ${error}`);
    return null;
  }
}

checkuser();
