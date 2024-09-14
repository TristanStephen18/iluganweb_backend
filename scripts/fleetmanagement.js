import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  getDoc,
  getDocs,
  doc,
  GeoPoint,
  collection,
} from "https://www.gstatic.com/firebasejs/10.13/firebase-firestore.js";

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

// Global Variables
const addVehicleForm = document.querySelector("#add-vehicle-form");
let terminalLat = null;
let terminalLng = null;
let userid = null;
let buses = [];
let bus_counter = 0;
let moving_buses_counter = 0;
let parked_buses = 0;

// Utility function to add markers to the map
function addBusToMap(position) {
  const marker = new google.maps.Marker({
    position,
    map: map,
    icon: {
      url: "icon.png",
      scaledSize: new google.maps.Size(30, 30),
    },
  });
  marker.addListener("click", () => {
    alert(`Lat: ${position.lat} Longitude:  ${position.lng}`);
  });
  buses.push(marker);
}

// Add Vehicle Form Submission
addVehicleForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const busNumber = addVehicleForm["bus_number"].value;
  const plateNumber = addVehicleForm["plate_number"].value;
  const destination = addVehicleForm["destination"].value;

  addDataToFirestore(
    userid,
    busNumber,
    plateNumber,
    destination,
    terminalLat,
    terminalLng
  );
});

// Add Data to Firestore
async function addDataToFirestore(
  companyId,
  busNumber,
  plateNumber,
  destination,
  lat,
  lng
) {
  try {
    const location = new GeoPoint(terminalLat, terminalLng);
    await setDoc(doc(db, `companies/${companyId}/buses`, plateNumber), {
      destination,
      terminal_location: location,
      bus_number: busNumber,
      plate_number: plateNumber,
      available_seats: 32,
      reserved_seats: 0,
      occupied_seats: 0,
      current_location: location,
    });
    alert("Vehicle Added to the Fleet");
    await getBuses(companyId); // Fetch buses again after adding
  } catch (error) {
    console.error("Error writing document: ", error);
  }
}

// Check Authentication and Fetch User Data
function checkUser() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is logged in:", user.uid);
      userid = user.uid;
      // 
      getTerminalLocation(userid);
      getBuses(userid);
    } else {
      console.log("No user is signed in.");
      window.location.assign("login.html");
    }
  });
}

// Fetch Terminal Location
async function getTerminalLocation(uid) {
  try {
    const docRef = doc(db, "companies", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const location = docSnap.data().terminal_location;
      if (location) {
        terminalLat = location.latitude;
        terminalLng = location.longitude;
        console.log("Terminal Location:", terminalLat, terminalLng);
      } else {
        console.log("No terminal location found");
      }
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error fetching terminal location: ", error);
  }
}

// Fetch Buses
async function getBuses(companyId) {
  buses = []; // Reset buses array
  bus_counter = 0; // Reset the counters
  moving_buses_counter = 0;
  parked_buses = 0;

  try {
    const documentRef = collection(db, `companies/${companyId}/buses`);
    const snapshot = await getDocs(documentRef);

    if (snapshot.empty) {
      console.log("No buses found");
    } else {
      snapshot.forEach((doc) => {
        const busData = doc.data();
        const busLocation = busData.current_location;

        if (busLocation?.latitude && busLocation?.longitude) {
          const position = {
            lat: busLocation.latitude,
            lng: busLocation.longitude,
          };
          bus_counter++; // Increment total bus counter
          console.log(`buslat: ${busLocation.latitude} buslong: ${busLocation.longitude}`);
          console.log(`${terminalLat}, ${terminalLng}`);

          if (
            busLocation.latitude !== terminalLat &&
            busLocation.longitude !== terminalLng
          ) {
            moving_buses_counter++; // Count moving buses
          } else if (
            busLocation.latitude === terminalLat &&
            busLocation.longitude === terminalLng
          ) {
            parked_buses++; // Count parked buses
          }

          addBusToMap(position); // Add bus marker to the map
        }

        console.log(
          `Bus Number: ${busData.bus_number}, Plate: ${busData.plate_number}`
        );
      });
    }
  } catch (error) {
    console.error("Error fetching buses: ", error);
  }

  // Update HTML elements
  const tracking_buses = document.getElementById('number_of_buses');
  const parked_buses_counter = document.getElementById('parked_b');
  const moving_buses_element = document.getElementById('moving'); // Rename to avoid conflicts

  // Update the counters in the UI
  tracking_buses.innerText = bus_counter;
  parked_buses_counter.innerText = parked_buses;
  moving_buses_element.innerText = moving_buses_counter;
}

 const tracking_buses = document.getElementById('number_of_buses');
  const parked_buses_counter = document.getElementById('parked_b');
  const moving_buses = document.getElementById('moving');
  
  // console.log(bus_counter);
  // console.log(tracking_buses.value);
  console.log(moving_buses_counter);
  console.log(parked_buses);

  tracking_buses.innerText = bus_counter;
  parked_buses_counter.innerText = parked_buses;

  tracking_buses.value = `${bus_counter}`;
// Initialize on page load
window.onload = checkUser;
