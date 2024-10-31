import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
// import Swal from "sweetalert2/dist/sweetalert2.js";

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

const snpform = document.querySelector("#login-form");

snpform.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = snpform["email"].value;
  const password = snpform["password"].value;

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      const userDocRef = doc(db, "companies", user.uid);
      
      try {
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const terminalLocation = userDoc.data().terminal_location;
          
          if (terminalLocation !== null) {
            window.location.assign("homepage.html");
          } else {
            window.location.assign("selectterminaloc.html");
          }
        } else {
          console.log('Company data was not found on this user');
          Swal.fire({
            title: "Error",
            text: "Company data not found for this user.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: error.message,
          icon: "error",
          confirmButtonText: "OK",
        });
        console.log('Error'+ error.message);
      }
    })
    .catch((error) => {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonText: "Cool",
      });
      console.log('Error'+ error.message);
    });
});
