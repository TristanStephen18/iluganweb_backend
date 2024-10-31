import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

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

const currentDate = new Date();
const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
});

// console.log(formattedDate);

import {
  getFirestore,
  setDoc,
  doc,
  GeoPoint,
  Timestamp,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const db = getFirestore();

const snpform = document.querySelector("#signup-form");

async function addData(id, mail, pass, comp, subscriptionType, expiryDate) {
  try {
    await setDoc(doc(db, "companies", id), {
      company_name: comp,
      terminal_location: null,
      email: mail,
      password: pass,
      subscribed: true,
      subscriptionType: subscriptionType,
      subscribedAt: Timestamp.now(),
      expiryDate: Timestamp.fromDate(expiryDate),
    });
    Swal.fire({
      title: "Account Created Successfully",
      text: "You cannow log in to our system",
      icon: "success",
      confirmButtonText: "OK",
    }).then(() => {
      window.location.assign("login.html");
    });
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error,
      icon: "error",
      confirmButtonText: "OK",
    });
  }
}

async function updateAdminData(id, mail, pass, comp, subscriptionType, expiryDate, amount) {
  try {
    // Set the company data under `admin/admin1/companies`
    await setDoc(doc(db, "admin/admin1/companies", comp), {
      company_name: comp,
      terminal_location: null,
      email: mail,
      subscriptionType: subscriptionType,
      subscribedAt: Timestamp.now(),
      expiryDate: Timestamp.fromDate(expiryDate),
      amountpayable: amount,
      paid: true
    });

    // Define reference to the 'ilugan/data' document
    const iluganDocRef = doc(db, 'admin/admin1/ilugan', formattedDate);

    // Attempt to fetch the existing document
    const iluganDocSnap = await getDoc(iluganDocRef);

    if (iluganDocSnap.exists()) {
      // If document exists, update existing values
      const currentData = iluganDocSnap.data();
      
      // Update total revenue by adding the new amount
      await updateDoc(iluganDocRef, {
        totalrevenue: currentData.totalrevenue + amount,
        webusers: currentData.webusers + 1,
        mobileusers: currentData.mobileusers + 1
      });
    } else {
      // If document doesn't exist, create it with initial values
      await setDoc(iluganDocRef, {
        totalrevenue: amount,
        webusers: 1,
        mobileusers: 1
      });
    }
    addData(id, mail, pass, comp, subscriptionType, expiryDate);
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error",
      confirmButtonText: "OK",
    });
  }
}


function getSubscriptionExpiry(subscriptionType) {
  const subscriptionDate = new Date(); // current date/time when user subscribes
  let expiryDate = new Date(subscriptionDate); // copy of the subscription date

  // Add time based on subscription type
  switch (subscriptionType) {
    case 'Annual':
      expiryDate.setFullYear(subscriptionDate.getFullYear() + 1);
      break;
    case 'Semi-Annual':
      expiryDate.setMonth(subscriptionDate.getMonth() + 6);
      break;
    case 'Quarterly':
      expiryDate.setMonth(subscriptionDate.getMonth() + 3);
      break;
    default:
      throw new Error('Invalid subscription type');
  }

  return expiryDate;
}

snpform.addEventListener("submit", (e) => {
  e.preventDefault();

  const subscriptionModal = document.getElementById("subscriptionModal");
  const loader = document.querySelector(".loader");
  const promp = document.querySelector(".promp");
  let selectedPlan = null;
  let selectedPrice = null;

  const email = snpform["email"].value;
  const password = snpform["password"].value;
  const company = snpform["company"].value;

  if(password.length <= 7){
    Swal.fire({
      title: "Account Creation Error",
      text: 'Password Should be atleast 8 caharacters',
      icon: "error",
      confirmButtonText: "OK",
    });
  }else{
    subscriptionModal.style.display = "flex";
  }

  const subscriptionCards = document.querySelectorAll(".subscription-card");
  subscriptionCards.forEach((card) => {
    card.addEventListener("click", function () {
      subscriptionCards.forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");
      selectedPrice = this.getAttribute("data-price");
      selectedPlan = this.getAttribute("data-plan");
    });
  });


  const payNowBtn = document.getElementById("payNowBtn");
  payNowBtn.addEventListener("click", function () {
    console.log('Paying');
    if (selectedPlan && selectedPrice) {

      const expiryDate = getSubscriptionExpiry(selectedPlan); 
      
      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: "Basic c2tfdGVzdF9YVmZ1c0ZMeldMZ1c3TXFGS3g5RGgyRks6",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: parseFloat(selectedPrice),
              description: "Subscription",
              remarks: selectedPlan,
            },
          },
        }),
      };

      fetch("https://api.paymongo.com/v1/links", options)
        .then((response) => response.json())
        .then((response) => {
          window.open(response.data.attributes.checkout_url);

          const checkStatusInterval = setInterval(() => {
            loader.style.display = "block";
            promp.style.display = "block";

            const options = { 
              method: "GET",
              headers: {
                accept: "application/json",
                authorization:
                  "Basic c2tfdGVzdF9YVmZ1c0ZMeldMZ1c3TXFGS3g5RGgyRks6",
              },
            };

            fetch(
              `https://api.paymongo.com/v1/links/${response.data.id}`,
              options
            )
              .then((response) => response.json())
              .then((statusResponse) => {
                if (statusResponse.data.attributes.status === "paid") {
                  clearInterval(checkStatusInterval); // Stop polling
                  createUserWithEmailAndPassword(auth, email, password)
                    .then((cred) => {
                      // addData(cred.user.uid, email, password, company, selectedPlan, expiryDate);
                      updateAdminData(cred.user.uid, email, password, company, selectedPlan, expiryDate, (parseFloat(selectedPrice)/100));
                      loader.style.display = "none";
                      promp.style.display = "none";
                    })
                    .catch((error) => {
                      Swal.fire({
                        title: "Error creating your account",
                        text: error.message,
                        icon: "error",
                        confirmButtonText: "OK",
                      });
                    });
                }
              })
              .catch((err) => console.error(err));
          }, 5000); // Poll every 5 seconds
        })
        .catch((err) => console.error(err));
    } else {
      alert("Please select a subscription plan.");
    }
  });

  // Close modal when clicking outside content (optional)
  window.addEventListener("click", function (e) {
    if (e.target === subscriptionModal) {
      subscriptionModal.style.display = "none";
    }
  });
});

// const signupForm = document.getElementById("signupform");
//       const subscriptionModal = document.getElementById("subscriptionModal");
//       const loader = document.querySelector(".loader");
//       const promp = document.querySelector(".promp");

//       let selectedPlan = null;
//       let selectedPrice = null;

//       signupForm.addEventListener("submit", function (e) {
//         e.preventDefault(); // Prevent form submission
//         subscriptionModal.style.display = "flex";
//       });

//       // Handle subscription selection
//       const subscriptionCards = document.querySelectorAll(".subscription-card");
//       subscriptionCards.forEach((card) => {
//         card.addEventListener("click", function () {
//           // Remove selected class from all cards
//           subscriptionCards.forEach((c) => c.classList.remove("selected"));
//           // Add selected class to the clicked card
//           this.classList.add("selected");
//           selectedPrice = this.getAttribute("data-price");
//           selectedPlan = this.getAttribute("data-plan");
//         });
//       });

//       // Handle "Pay Now" button click
//       const payNowBtn = document.getElementById("payNowBtn");
//       payNowBtn.addEventListener("click", function () {
//         if (selectedPlan && selectedPrice) {
//           const options = {
//             method: "POST",
//             headers: {
//               accept: "application/json",
//               "content-type": "application/json",
//               authorization:
//                 "Basic c2tfdGVzdF9YVmZ1c0ZMeldMZ1c3TXFGS3g5RGgyRks6",
//             },
//             body: JSON.stringify({
//               data: {
//                 attributes: {
//                   amount: parseFloat(selectedPrice),
//                   description: "Subscription",
//                   remarks: selectedPlan,
//                 },
//               },
//             }),
//           };

//           fetch("https://api.paymongo.com/v1/links", options)
//             .then((response) => response.json())
//             .then((response) => {
//               window.open(response.data.attributes.checkout_url);

//               const checkStatusInterval = setInterval(() => {
//                 // Show loader
//                 loader.style.display = "block";
//                 promp.style.display = "block";

//                 const options = {
//                   method: "GET",
//                   headers: {
//                     accept: "application/json",
//                     authorization:
//                       "Basic c2tfdGVzdF9YVmZ1c0ZMeldMZ1c3TXFGS3g5RGgyRks6",
//                   },
//                 };

//                 fetch(
//                   `https://api.paymongo.com/v1/links/${response.data.id}`,
//                   options
//                 )
//                   .then((response) => response.json())
//                   .then((statusResponse) => {
//                     if (statusResponse.data.attributes.status === "paid") {
//                       clearInterval(checkStatusInterval); // Stop polling
//                       loader.style.display = "none";
//                       promp.style.display = "none";
//                       window.location.assign("index.html");
//                     }
//                   })
//                   .catch((err) => console.error(err));
//               }, 5000); // Poll every 5 seconds
//             })
//             .catch((err) => console.error(err));
//         } else {
//           alert("Please select a subscription plan.");
//         }
//       });

//       // Close modal when clicking outside content (optional)
//       window.addEventListener("click", function (e) {
//         if (e.target === subscriptionModal) {
//           subscriptionModal.style.display = "none";
//         }
//       });
