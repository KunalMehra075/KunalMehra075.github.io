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
let brand = document.getElementById("brandlogog");
window.addEventListener("scroll", () => {
  let value = window.scrollY;
  about.style.transform = `translateX(${value - 500}px)`;
  project.style.transform = `translateX(${-value + 1200}px)`;
});

//? <!----------------------------------------------- < Resume> ----------------------------------------------->

let introgif = document.getElementById("introgif");
let resumedownload = document
  .getElementById("resumedownload")
  .addEventListener("click", () => {
    window.open("Kunal_Mehra_Resume.pdf", "_blank");
  });
//? <!----------------------------------------------- < Project and models > ----------------------------------------------->

document.addEventListener("click", (e) => {
  if (e.target.matches("[data-stylezilla]")) {
    console.log("Stylezilla");
  } else if (e.target.matches("[data-orangefry]")) {
    console.log("Orangefry");
  } else if (e.target.matches("[data-placeme]")) {
    console.log("placeme");
  } else if (e.target.matches("[data-astry]")) {
    console.log("astry");
  }
});
