var userno = 0;
var tbody = document.getElementById("tbody1");
const title = document.getElementById("h2");

title.addEventListener("click", () => {
  console.log("clicked");
});

function adddatatotable(docid, fname, lname, bday, email, pass, phone) {
  let trow = document.createElement("tr");
  // let uid = document.createElement("td");
  let td1 = document.createElement("td");
  let td2 = document.createElement("td");
  let td3 = document.createElement("td");
  let td4 = document.createElement("td");
  let td5 = document.createElement("td");
  let td6 = document.createElement("td");
  let td7 = document.createElement("td");
  let td8 = document.createElement("td");

  // uid.innerHTML = docid;
  td1.innerHTML = ++userno;
  td2.innerHTML = fname;
  td3.innerHTML = lname;
  td4.innerHTML = bday;
  td5.innerHTML = email;
  td6.innerHTML = pass;
  td7.innerHTML = phone;

  let deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger";
  deleteBtn.style.marginRight = "10px";
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = function () {
    alert("Do you want to delete this data?");
  };

  let editBtn = document.createElement("button");
  editBtn.className = "btn btn-primary";
  editBtn.textContent = "Edit";
  editBtn.onclick = function () {
    // need to transfer user data on this part
    window.location.assign("edit.html?id=" + docid);
  };

  let actionsSpan = document.createElement("span");
  actionsSpan.appendChild(deleteBtn);
  actionsSpan.appendChild(editBtn);

  td8.appendChild(actionsSpan);

  // trow.appendChild(uid);
  trow.appendChild(td1);
  trow.appendChild(td2);
  trow.appendChild(td3);
  trow.appendChild(td4);
  trow.appendChild(td5);
  trow.appendChild(td6);
  trow.appendChild(td7);
  trow.appendChild(td8);

  tbody.appendChild(trow);
}

function Additemstotable(Users) {
  userno = 0;
  tbody.innerHTML = "";
  Users.forEach((element) => {
    adddatatotable(
      element.id,
      element.first_name,
      element.last_name,
      element.birthday,
      element.email,
      element.password,
      element.phone_number
    );
  });
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

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

import {
  getFirestore,
  getDoc,
  getDocs,
  collection,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.13/firebase-firestore.js";

const db = getFirestore();

async function getalldata() {
  const querySnapshot = await getDocs(collection(db, "users"));

  var data = [];

  querySnapshot.forEach((doc) => {
    data.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  console.log(data);
  Additemstotable(data);
}

window.onload = getalldata;
