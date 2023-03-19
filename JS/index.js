//? <!----------------------------------------------- < Preloader & Progressbar> ----------------------------------------------->

let brandbg = document.getElementById("brandbg");
brandbg.innerHTML = `<span class="spinner-grow text-primary" role="status"></span>
Kunal `;
let gitloadercal = document.getElementById("gitcalendar");
window.addEventListener("load", function () {
  brandbg.innerHTML = `🔵 Kunal `;
  GitHubCalendar(".calendar", "KunalMehra075", { responsive: true });
});

function TopButtonFunction() {
  if (!topbutton) return;
  if (document.documentElement.scrollTop > 60) {
    topbutton.style.display = "block";
  } else {
    topbutton.style.display = "none";
  }
}
let topbutton = document.getElementById("topbutton");
topbutton.addEventListener(
  "click",
  () => (document.documentElement.scrollTop = 0)
);

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
  TopButtonFunction();
  let value = window.scrollY;
  aboutroll.style.transform = `translateX(${(value - 2400) / 3}px)`;
  projectroll.style.transform = `translateX(${(-value + 2700) / 3}px)`;
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

//? <!----------------------------------------------- < Repo Redirect> ----------------------------------------------->
Repo1.addEventListener("click", () => {
  window.open("https://github.com/KunalMehra075/OrangeFryFrontend");
});
Repo2.addEventListener("click", () => {
  window.open("https://github.com/KunalMehra075/MyCal.com-Frontend");
});
Repo3.addEventListener("click", () => {
  window.open("https://github.com/Tanishka-22/KK-Kushwah");
});
Repo4.addEventListener("click", () => {
  window.open("https://github.com/KunalMehra075/obscene-icicle-4134 ");
});

brandbg.addEventListener("click", (e) => {
  console.log(e);
});
