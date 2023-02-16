//? <!----------------------------------------------- < Preloader & Progressbar> ----------------------------------------------->

var loader = document.querySelector("#preloader");
window.addEventListener("load", function () {
  loader.style.display = "none";
});

const filled = document.querySelector(".filled");
function update() {
  filled.style.width = `${
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  }%`;
  requestAnimationFrame(update);
}
update();
//? <!----------------------------------------------- < Scroll slide animations> ----------------------------------------------->
let about = document.getElementById("about");
let project = document.getElementById("projectHead");
window.addEventListener("scroll", () => {
  let value = window.scrollY;
  about.style.transform = `translateX(${value - 500}px)`;
  project.style.transform = `translateX(${-value + 1200}px)`;
});

//? <!----------------------------------------------- < Resume> ----------------------------------------------->

let resumedownload = document
  .getElementById("resumedownload")
  .addEventListener("click", () => {
    window.open("Kunal_Mehra_Resume.pdf", "_blank");
  });

//? <!----------------------------------------------- < Lets Connect form> ----------------------------------------------->
let letsconnectform = document.getElementById("letsconnectform");
letsconnectform.addEventListener("submit", (e) => {
  e.preventDefault();
  if (letsconnectform.textmessage.value == "") {
    swal("Empty text cannot be sent.", "", "info");
    return;
  }
  let obj = {
    name:
      letsconnectform.firstname.value + " " + letsconnectform.lastname.value,
    email: letsconnectform.email.value,
    message: letsconnectform.textmessage.value,
  };

  swal("Message sent.", "Will reply soon!", "success");
  letsconnectform.firstname.value = "";
  letsconnectform.lastname.value = "";
  letsconnectform.email.value = "";
  letsconnectform.textmessage.value = "";
});
