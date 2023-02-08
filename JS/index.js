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
  project.style.transform = `translateX(${-value + 800}px)`;
});

//? <!----------------------------------------------- < Section Name> ----------------------------------------------->

// window.addEventListener("load", () => {
//   setTimeout(() => {
//     hellofv.innerText = "Hey There!";
//   }, 500);
//   setTimeout(() => {
//     hellofv.innerText = "This is";
//   }, 1500);
//   setTimeout(() => {
//     kunalfv.innerText = "Kunal Mehra";
//   }, 3000);
//   setTimeout(() => {
//     fullstackfv.innerText = "A Full Stack Web Developer📌";
//   }, 4000);
// });

const myModal = document.getElementById("myModal");
const myInput = document.getElementById("myInput");

myModal.addEventListener("shown.bs.modal", () => {
  myInput.focus();
});
