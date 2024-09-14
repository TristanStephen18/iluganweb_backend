import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.13/firebase-firestore.js";

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
let originalToken = null;
let comp_email = null;
let counter = 0;

const add_employee_form = document.querySelector("#add-employees-form");

add_employee_form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const employee_id = add_employee_form["emp-id"].value;
  const emp_email = add_employee_form["email"].value;
  const emp_password = add_employee_form["password"].value;
  const emp_type = add_employee_form["employee_type"].value;
  const employee_name = add_employee_form["name"].value;

  try {
    await createUserWithEmailAndPassword(auth, emp_email, emp_password).then((cred)=>{
        console.log("New employee account created.");
    });
    await addDataToFirestore(
        employee_id,
        employee_name,
        emp_email,
        emp_password,
        emp_type
      );
    await auth.signOut();
    await signInWithEmailAndPassword(
      auth,
      comp_email,
      prompt("Please re-enter your password:")
    );
    console.log("Original user reauthenticated.");
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error",
      confirmButtonText: "OK",
    });
  }
});

async function addDataToFirestore(empId, emp_name, email, password, type) {
  try {
    console.log(userid);
    await setDoc(doc(db, `companies/${userid}/employees`, empId), {
      id: empId,
      email: email,
      password: password,
      type: type,
    });
    alert("Employee Added");
  } catch (error) {
    console.error("Error writing document: ", error);
  }
}

function checkUser() {
  onAuthStateChanged(auth, async (user) => {
    if (user && counter === 0) {
      console.log("User is logged in:", user.uid);
      userid = user.uid;
      comp_email = user.email;
      counter = 2;
      originalToken = await user.getIdToken(true);
    } else {
      if (counter === 0) {
        window.location.assign("login.html");
      }
    }
  });
}

window.onload = checkUser;
