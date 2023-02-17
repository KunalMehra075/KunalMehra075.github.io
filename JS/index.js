//? <!----------------------------------------------- < Preloader & Progressbar> ----------------------------------------------->

var loader = document.querySelector("#preloader");
window.addEventListener("load", function () {
  loader.style.display = "none";
});
let topbutton = document.getElementById("topbutton");
function scrollFunction() {
  if (!topbutton) return;
  if (document.body.scrollTop > 60 || document.documentElement.scrollTop > 60) {
    topbutton.style.display = "block";
  } else {
    topbutton.style.display = "none";
  }
}

window.onscroll = function () {
  scrollFunction();
};
let topFunction = () => {
  document.documentElement.scrollTop = 0;
};
topbutton.addEventListener("click", topFunction);

const filled = document.querySelector(".filled");
function update() {
  filled.style.width = `${
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  }%`;
  requestAnimationFrame(update);
}
update();
//? <!----------------------------------------------- < Scroll slide animations> ----------------------------------------------->
let aboutroll = document.getElementById("Aboutroll");
let projectroll = document.getElementById("projectHead");
window.addEventListener("scroll", () => {
  let value = window.scrollY;
  aboutroll.style.transform = `translateX(${value - 440}px)`;
  projectroll.style.transform = `translateX(${-value + 1300}px)`;
});

//? <!----------------------------------------------- < Resume> ----------------------------------------------->

let resumedownload1 = document
  .getElementById("resume-button-1")
  .addEventListener("click", () => {
    window.open("Kunal_Mehra_Resume.pdf", "_blank");
  });
let resumedownload2 = document
  .getElementById("resume-button-2")
  .addEventListener("click", () => {
    window.open("Kunal_Mehra_Resume.pdf", "_blank");
  });
let cvdownload = document
  .getElementById("cvdownloadlink")
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
