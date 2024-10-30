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
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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
const database = getDatabase(app);

// Global Variables
let terminalLat = null;
let terminalLng = null;
let userid = null;
let buses = [];
let icon = "";

// Function to fetch GPS coordinates from Realtime Database
function getBusLocationFromRealtimeDB(avail, reserved, conductor, occupied, destin, busnum,  platenum) {
  const gpsRef = ref(database, 'gps');
  
  onValue(gpsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const lat = data.lat;
      const lng = data.long;
      console.log("Realtime Database GPS coordinates:", lat, lng);
      
      // Use these coordinates to add the bus marker on the map
      const position = { lat: lat, lng: lng };
      addBusToMap(position, icon, avail, reserved, conductor, occupied, destin, busnum, platenum);
    } else {
      console.log("No data available in Realtime Database");
    }
  }, (error) => {
    console.error("Error fetching data from Realtime Database:", error);
  });
}

// Function to reverse geocode the location
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

// Function to show bus information
async function showBusInfo(
  busNumber,
  plateNumber,
  current_loc,
  seats_avail,
  seats_res,
  occu_seats,
  conduct,
  destin
) {
  if (conduct == "") {
    conduct = "NO conductor yet";
  }
  document.getElementById("busNumber").innerText = busNumber;
  document.getElementById("plateNumber").innerText = plateNumber;
  document.getElementById("currentLocation").innerText = current_loc;
  document.getElementById("destination").innerText = destin;
  document.getElementById("availableSeats").innerText = seats_avail;
  document.getElementById("reservedSeats").innerText = seats_res;
  document.getElementById("conductorName").innerText = conduct;
  document.getElementById("driverName").innerText = "Driver";

  const busInfoContainer = document.getElementById("busInfoContainer");
  busInfoContainer.classList.remove("hidden");

  const closeBtn = document.getElementById("closeBusInfo");
  closeBtn.addEventListener("click", () => {
    busInfoContainer.classList.add("hidden");
  });
}

// Function to add a bus marker on the map
async function addBusToMap(
  position,
  icon,
  avail,
  res,
  cond,
  occ,
  endpoint,
  busNum,
  plateNum
) {
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

  if (lat == terminalLat && lng == terminalLng) {
    address = "Currently at Terminal";
  } else {
    address = await reverseGeocode(lat, lng);
    if(address == 'undefined') {
      address = 'Failed to Reverse Geocode';
    }
  }

  marker.addListener("click", () => {
    showBusInfo(busNum, plateNum, address, avail, res, occ, cond, endpoint);
  });

  buses.push(marker);
}

// Function to check user authentication
function checkUser() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is logged in:", user.uid);
      userid = user.uid;
      getTerminalLocation(userid);
      getBuses(userid);
    } else {
      console.log("No user is signed in.");
      window.location.assign("login.html");
    }
  });
}

// Function to get terminal location from Firestore
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

// Function to get buses from Firestore
async function getBuses(companyId) {
  buses = []; // Reset buses array

  try {
    const documentRef = collection(db, `companies/${companyId}/buses`);

    // Real-time updates using onSnapshot
    onSnapshot(documentRef, (snapshot) => {
      let bus_counter = 0;
      let moving_buses_counter = 0;
      let parked_buses = 0;

      // Clear existing markers from the map
      buses.forEach((marker) => marker.setMap(null));
      buses = [];

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

            if (
              busLocation.latitude !== terminalLat &&
              busLocation.longitude !== terminalLng
            ) {
              icon = "../images/iconr.png";
              moving_buses_counter++; // Count moving buses
            } else {
              icon = "../images/iconb.png";
              parked_buses++; // Count parked buses
            }

            // Skip a specific bus to fetch its coordinates from Realtime DB
            if(busData.bus_number == 'BUS 1231') {
              getBusLocationFromRealtimeDB(
                busData.available_seats,
                busData.reserved_seats,
                busData.conductor,
                busData.occupied_seats,
                busData.destination,
                busData.bus_number,
                busData.plate_number
              );  // Fetch coordinates from Realtime Database
            } else {
              addBusToMap(
                position,
                icon,
                busData.available_seats,
                busData.reserved_seats,
                busData.conductor,
                busData.occupied_seats,
                busData.destination,
                busData.bus_number,
                busData.plate_number
              );
            }

            console.log(
              `Bus Number: ${busData.bus_number}, Plate: ${busData.plate_number}`
            );
          }
        });
      }

      // Update HTML elements after counters are calculated
      const tracking_buses = document.getElementById("number_of_buses");
      const parked_buses_counter = document.getElementById("parked_b");
      const moving_buses_element = document.getElementById("moving");

      tracking_buses.innerText = bus_counter;
      parked_buses_counter.innerText = parked_buses;
      moving_buses_element.innerText = moving_buses_counter;
    });
  } catch (error) {
    console.error("Error fetching buses: ", error);
  }
}

window.onload = checkUser;
