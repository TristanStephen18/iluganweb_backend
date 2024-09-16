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

const Destinations = [
  {
    location: "Dagupan",
    coordinates: "16.043300, 120.333300",
  },
  {
    location: "Cubao",
    coordinates: "14.6187, 121.0510",
  },
  {
    location: "Manila",
    coordinates: "14.5995, 120.9842",
  },
  {
    location: "Cavite",
    coordinates: "14.4828, 120.9169",
  },
  {
    location: "Taguig",
    coordinates: "14.5176, 121.0509",
  },
  {
    location: "Manaoag",
    coordinates: "16.0431, 120.4877",
  },
  {
    location: "Tarlac",
    coordinates: "15.4802, 120.5979",
  },
  {
    location: "Cabanatuan",
    coordinates: "15.4860, 120.9675",
  },
  {
    location: "Baguio",
    coordinates: "16.4023, 120.5960",
  },
  {
    location: "La Union",
    coordinates: "16.6150, 120.3199",
  },
  {
    location: "Pasay",
    coordinates: "14.5378, 121.0014",
  },
  {
    location: "Urdaneta",
    coordinates: "15.9757, 120.5719",
  },
];

const addVehicleForm = document.querySelector("#add-vehicle-form");
let terminalLat = null;
let terminalLng = null;
let userid = null;
let apiKey = "pk.e6e28e751bd0e401a2a07cb0cbe2e6e4";
const apiKeyDistance = 'KI0g89qwGyjqflqUTyKFFfC3aFub5IPflkx4L9sOkGUxqXXRXpeIpuxNII3GI1pf';
let origin = null;

addVehicleForm.addEventListener("submit", async (e) => {
  console.log("clicked");
  e.preventDefault();
  const busNumber = addVehicleForm["bus_number"].value;
  const plateNumber = addVehicleForm["plate_number"].value;
  const destination = addVehicleForm["destination"].value;
  const departure_time = addVehicleForm["departure"].value;
  const operation_end_time = addVehicleForm["end"].value;
  let destination_coordinates = null;


  Destinations.forEach((value) => {
    if (destination == value.location) {
      const coordinates = value.coordinates.split(",");
      destination_coordinates = new GeoPoint(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
    }
  });

  const distance = await getDistance(origin, destination_coordinates);
  const duration = await getEstimatedTime(origin, destination_coordinates);
  console.log(`${distance}, ${duration}`);

  addDataToFirestore(
    userid,
    busNumber,
    plateNumber,
    destination,
    terminalLat,
    terminalLng,
    departure_time,
    operation_end_time,
    destination_coordinates,
    distance,
    duration
  );
  addBusToTrackingBuses(
    userid,
    busNumber,
    plateNumber,
    destination,
    terminalLat,
    terminalLng,
    departure_time,
    operation_end_time,
    destination_coordinates,
    distance,
    duration
  );
});

async function getDistance(origin, end) {
  try {
    const response = await fetch(
      `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${end.latitude},${end.longitude}&key=${apiKeyDistance}`
    );
    const data = await response.json();
    return data.rows[0].elements[0].distance.text;
  } catch (error) {
    console.error("Error fetching distance:", error);
    return null;
  }
}

async function getEstimatedTime(origin, end) {
  try {
    const response = await fetch(
      `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${end.latitude},${end.longitude}&key=${apiKeyDistance}`
    );
    const data = await response.json();
    return data.rows[0].elements[0].duration.text;
  } catch (error) {
    console.error("Error fetching estimated time:", error);
    return null;
  }
}


async function addDataToFirestore(
  companyId,
  busNumber,
  plateNumber,
  destination,
  lat,
  lng,
  dep_time,
  end_op_time,
  destination_coordinates,
  distance_from_destination,
  estimated_time_of_arrival,
) {
  try {
    const location = new GeoPoint(14.618783037942265, 121.0512145711125);
    await setDoc(doc(db, `companies/${companyId}/buses`, plateNumber), {
      destination: destination,
      destination_coordinates: destination_coordinates,
      distance_from_destination: distance_from_destination,
      estimated_time_of_arrival:estimated_time_of_arrival,
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
  end_op_time,
  destination_coordinates,
  distance_from_destination,
  estimated_time_of_arrival,
) {
  try {
    const location = new GeoPoint(terminalLat, terminalLng);
    await setDoc(doc(db, `tracking_buses`, plateNumber), {
      destination: destination,
      destination_coordinates: destination_coordinates,
      distance_from_destination: distance_from_destination,
      estimated_time_of_arrival:estimated_time_of_arrival,
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
        origin = new GeoPoint(parseFloat(terminalLat), parseFloat(terminalLng));
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
      const current_loc = new GeoPoint(parseFloat(currentLat),parseFloat(currentLng));
      const distance = await getDistance(current_loc, bus.destination_coordinates);
      console.log(distance);
      console.log(distance.split(' ')[0]);

      if (currentLat == terminalLat && currentLng == terminalLng) {
        address = "Currently at Terminal";
      }else if(distance.split(' ')[0] <= 1 && distance.split(' ')[1] == 'km' || distance.split(' ')[1] == 'm'){
        address = 'Arrived at destination';
      } else {
        address = await reverseGeocode(currentLat, currentLng);
      }

      if (bus.conductor == "") {
        conductor = "None";
      } else {
        conductor = bus.conductor;
      }

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${bus.bus_number}</td>
        <td>${bus.plate_number}</td>
        <td>${bus.departure_time} am - ${bus.end_operation_time} pm</td>
        <td>${bus.destination}</td>
        <td>${bus.distance_from_destination}</td>
        <td>${bus.estimated_time_of_arrival}</td>
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
  const apiKey = "pk.e6e28e751bd0e401a2a07cb0cbe2e6e4";
  const url = `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lon}&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.display_name; // Return the address from the response
  } catch (error) {
    console.error("Error fetching address:", error);
    return "Address not available";
  }
}

window.onload = checkUser;
