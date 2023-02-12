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
  project.style.transform = `translateX(${-value + 800}px)`;
  if (value > 2700 && value < 4000) {
    brand.style.filter = `invert()`;
  } else {
    brand.style.filter = `none`;
  }
});

//? <!----------------------------------------------- < Section Name> ----------------------------------------------->

let introgif = document.getElementById("introgif");
// window.addEventListener("load", () => {
//   setTimeout(() => {
//     introgif.style.display = "flex";
//   }, 100);
//   setTimeout(() => {
//     introgif.style.display = "none";
//   }, 2000);
// });

const myModal = document.getElementById("myModal");
const myInput = document.getElementById("myInput");

myModal.addEventListener("shown.bs.modal", () => {
  myInput.focus();
});

//? <!----------------------------------------------- < Section Name> ----------------------------------------------->
