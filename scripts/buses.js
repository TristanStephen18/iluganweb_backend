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
  onSnapshot
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

const addVehicleForm = document.querySelector("#add-vehicle-form");
let terminalLat = null;
let terminalLng = null;
let userid = null;
let apiKey = 'pk.e6e28e751bd0e401a2a07cb0cbe2e6e4';

addVehicleForm.addEventListener("submit", (e) => {
  console.log("clicked");
  e.preventDefault();
  const busNumber = addVehicleForm["bus_number"].value;
  const plateNumber = addVehicleForm["plate_number"].value;
  const destination = addVehicleForm["destination"].value;
  const departure_time = addVehicleForm["departure"].value;
  const operation_end_time = addVehicleForm["end"].value;

  addDataToFirestore(
    userid,
    busNumber,
    plateNumber,
    destination,
    terminalLat,
    terminalLng,
    departure_time,
    operation_end_time
  );
  addBusToTrackingBuses(
    userid,
    busNumber,
    plateNumber,
    destination,
    terminalLat,
    terminalLng,
    departure_time,
    operation_end_time
  );
});

async function addDataToFirestore(
  companyId,
  busNumber,
  plateNumber,
  destination,
  lat,
  lng,
  dep_time,
  end_op_time
) {
  try {
    const location = new GeoPoint(15.97485383921185, 120.5579351956326);
    await setDoc(doc(db, `companies/${companyId}/buses`, plateNumber), {
      destination,
      conductor: "",
      departure_time: dep_time,
      end_operation_time: end_op_time,
      terminal_location: location,
      bus_number: busNumber,
      plate_number: plateNumber,
      available_seats: 32,
      reserved_seats: 0,
      occupied_seats: 0,
      current_location: location,
    });
    alert("Vehicle Added to the Fleet");
  } catch (error) {
    console.error("Error writing document: ", error);
  }
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

async function addBusToTrackingBuses(
  companyId,
  busNumber,
  plateNumber,
  destination,
  lat,
  lng,
  dep_time,
  end_op_time
) {
  try {
    const location = new GeoPoint(terminalLat, terminalLng);
    await setDoc(doc(db, `tracking_buses`, plateNumber), {
      destination,
      conductor: "",
      companyId: companyId,
      departure_time: dep_time,
      end_operation_time: end_op_time,
      terminal_location: location,
      bus_number: busNumber,
      plate_number: plateNumber,
      available_seats: 32,
      reserved_seats: 0,
      occupied_seats: 0,
      current_location: location,
    });
    alert("Vehicle Added to the Fleet");
  } catch (error) {
    console.error("Error writing document: ", error);
  }
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

function getBuses(companyId) {
  const busesTableBody = document.getElementById("buses_table");

  onSnapshot(collection(db, `companies/${companyId}/buses`), (snapshot) => {
    busesTableBody.innerHTML = ""; 
    snapshot.forEach(async (doc) => {
      const bus = doc.data();
      const currentLat = bus.current_location.latitude;
      const currentLng = bus.current_location.longitude;
      let address = null;
      let conductor = null;

      if(currentLat == terminalLat && currentLng == terminalLng){
        address = "Currently at Terminal";
      }else{
        address = await reverseGeocode(currentLat, currentLng);
      }

      if(bus.conductor == ""){
        conductor = "None";
      }else{
        conductor = bus.conductor;
      }

      const row = document.createElement("tr");
      
      row.innerHTML = `
        <td>${bus.bus_number}</td>
        <td>${bus.plate_number}</td>
        <td>${bus.departure_time} am - ${bus.end_operation_time} pm</td>
        <td>${bus.destination}</td>
        <td>${bus.available_seats}</td>
        <td>${bus.reserved_seats}</td>
        <td>${bus.occupied_seats}</td>
        <td>${conductor}</td>
        <td>${address}</td>  <!-- New Address Column -->
      `;

      busesTableBody.appendChild(row); 
    });
  });
}

// Function to reverse geocode the bus's current location using LocationIQ API
async function reverseGeocode(lat, lon) {
  const apiKey = 'pk.e6e28e751bd0e401a2a07cb0cbe2e6e4';
  const url = `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lon}&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.display_name; // Return the address from the response
  } catch (error) {
    console.error('Error fetching address:', error);
    return 'Address not available';
  }
}


window.onload = checkUser;
