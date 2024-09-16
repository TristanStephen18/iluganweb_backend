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
const apiKey = "pk.e6e28e751bd0e401a2a07cb0cbe2e6e4"; // Replace with your actual API key

// URL encode the query and create the API URL
// const apiUrl = `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(
// )}&format=json`;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global Variables
let terminalLat = null;
let terminalLng = null;
let userid = null;
let buses = [];
let bus_counter = 0;
let moving_buses_counter = 0;
let parked_buses = 0;
let icon = "";

async function reverseGeocode(lat, lng) {
  try {
    const apiKey = "pk.e6e28e751bd0e401a2a07cb0cbe2e6e4";
    const apiUrl = `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`;

    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.display_name;
  } catch (error) {
    console.error("Error with reverse geocoding: ", error);
    return "Location not available";
  }
}

async function showBusInfo(busNumber, plateNumber, current_loc, seats_avail, seats_res, occu_seats, conduct, destin) {

  if(conduct == ""){
    conduct = "NO condcutor yet";
  }
  document.getElementById("busNumber").innerText = busNumber;
  document.getElementById("plateNumber").innerText = plateNumber;
  document.getElementById("currentLocation").innerText = current_loc;
  document.getElementById("destination").innerText = destin;
  document.getElementById("availableSeats").innerText = seats_avail;
  document.getElementById("reservedSeats").innerText = seats_res;
  // document.getElementById("occupiedSeats").innerText = occu_seats;
  document.getElementById("conductorName").innerText = conduct;
  document.getElementById("driverName").innerText = "Driver"; 

  const busInfoContainer = document.getElementById("busInfoContainer");
  busInfoContainer.classList.remove("hidden");

  const closeBtn = document.getElementById("closeBusInfo");
  closeBtn.addEventListener("click", () => {
    busInfoContainer.classList.add("hidden");
  });
}

async function addBusToMap(position, icon, avail, res, cond, occ,  endpoint, busNum, plateNum) {
  const marker = new google.maps.Marker({
    position,
    map: map,
    icon: {
      url: icon,
      scaledSize: new google.maps.Size(30, 30),
    },
  });

  let address = null;
  const lat = position.lat;
  const lng = position.lng;

  if(lat == terminalLat && lng == terminalLng){
    address = "Currently at Terminal";
  }else {
    address = await reverseGeocode(lat, lng);
  }

  marker.addListener("click", () => {
    // alert(`${busNum}, ${plateNum},${address}, ${avail}, ${res}, ${occ}, ${cond}, ${endpoint}`);
    showBusInfo(busNum, plateNum, address, avail, res, occ, cond, endpoint);
  });

  buses.push(marker);
}

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

// // Fetch Terminal Location
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
          console.log(
            `buslat: ${busLocation.latitude} buslong: ${busLocation.longitude}`
          );
          console.log(`${terminalLat}, ${terminalLng}`);

          if (
            busLocation.latitude !== terminalLat &&
            busLocation.longitude !== terminalLng
          ) {
            icon = "iconr.png";
            moving_buses_counter++; // Count moving buses
          } else if (
            busLocation.latitude === terminalLat &&
            busLocation.longitude === terminalLng
          ) {
            icon = "iconb.png";
            parked_buses++; // Count parked buses
          }
          addBusToMap(position, icon, busData.available_seats, busData.reserved_seats, busData.conductor, busData.occupied_seats, busData.destination, busData.bus_number, busData.plate_number);
          // Add bus marker to the map
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
  const tracking_buses = document.getElementById("number_of_buses");
  const parked_buses_counter = document.getElementById("parked_b");
  const moving_buses_element = document.getElementById("moving"); // Rename to avoid conflicts

  // Update the counters in the UI
  tracking_buses.innerText = bus_counter;
  parked_buses_counter.innerText = parked_buses;
  moving_buses_element.innerText = moving_buses_counter;
}

const tracking_buses = document.getElementById("number_of_buses");
const parked_buses_counter = document.getElementById("parked_b");
const moving_buses = document.getElementById("moving");

// console.log(bus_counter);
// console.log(tracking_buses.value);
console.log(moving_buses_counter);
console.log(parked_buses);

tracking_buses.innerText = bus_counter;
parked_buses_counter.innerText = parked_buses;

tracking_buses.value = `${bus_counter}`;
// Initialize on page load
window.onload = checkUser;
