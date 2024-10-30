document.querySelector('#send').addEventListener('click', ()=>{
    sendMail();
});


function sendMail() {
    var params = {
      name: "Tristan",
      email: 'stephenrasco8@gmail.com',
      message: 'Hello',
    };
  
    const serviceID = "service_0hshchj";
    const templateID = "template_wped0xi"
  
      emailjs.send(serviceID, templateID, params)
      .then(res=>{
        //   document.getElementById("name").value = "";
        //   document.getElementById("email").value = "";
        //   document.getElementById("message").value = "";
          console.log(res);
          alert("Your message sent successfully!!")
  
      })
      .catch(err=>console.log(err));
  
  }
  