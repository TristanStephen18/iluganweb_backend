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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let userid = null;

function checkUser() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User is logged in:", user.uid);
        userid = user.uid;
        getEmployees(userid);
      } else {
        console.log("No user is signed in.");
        window.location.assign("login.html");
      }
    });
  }

  function getEmployees(companyId) {
    const employeesTableBody = document.getElementById("employees");
  
    onSnapshot(collection(db, `companies/${companyId}/employees`), (snapshot) => {
      employeesTableBody.innerHTML = "";
      snapshot.forEach(async (doc) => {
        const employees = doc.data();
        const row = document.createElement("tr");
  
        row.innerHTML = `
          <td>${employees.employee_name}</td>
          <td>${employees.id}</td>
          <td>${employees.email}</td>
          <td>${employees.password}</td>
          <td>${employees.type}</td>
        `;
  
        employeesTableBody.appendChild(row);
      });
    });
  }

  window.onload = checkUser;