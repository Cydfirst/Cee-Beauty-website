const WHATSAPP_NUMBER = "2349167632465";
function openWhatsApp(message) {
  const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  window.open(url, "_blank", "noopener,noreferrer");
}
document.querySelectorAll("[data-whatsapp]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  openWhatsApp("Hello Cee Beauty Aesthetics! I'd like to ask about your services and appointment availability.");
}));
document.querySelectorAll("[data-service]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  openWhatsApp("Hello Cee Beauty Aesthetics! I'd like to enquire about " + link.dataset.service + ". Please let me know your pricing and appointment availability.");
}));
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");
menuToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  menuToggle.textContent = isOpen ? "CLOSE ×" : "MENU ☰";
});
navMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  navMenu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "MENU ☰";
}));
document.querySelectorAll(".service-accordion").forEach((item) => item.addEventListener("toggle", () => {
  const action = item.querySelector(".accordion-action");
  if (action) action.innerHTML = item.open ? 'Hide services <b>−</b>' : 'View services <b>＋</b>';
}));
document.getElementById("year").textContent = new Date().getFullYear();


// Free appointment-request flow: the client sends their preferred details to Cee Beauty on WhatsApp.
const serviceOptions = {
  "Lash Extension Services": ["Lash Extension (Classic)", "Lash Extension (Hybrid)", "Lash Extension (Volume)", "Lash Extension (Mega Volume)", "Lash refill", "Lash removal", "Cluster lashes (Hybrid)", "Cluster lashes (Standard Volume)", "Cluster lashes (Heavy Volume)"],
  "Brow Services": ["Brow tint", "Nanoshading / Microshading", "Nano-blading / Nanostrokes", "Microblading", "Microblading removal"],
  "Waxing Services": ["Bikini line", "Chin waxing", "Eyebrow waxing", "Underarm wax", "Lower belly wax", "Tummy wax", "Lower back wax", "Bum wax", "Hollywood wax", "Full arm wax", "Half arm wax", "Full leg wax", "Half leg wax", "Full body wax (with Brazilian)", "Full body wax (without Brazilian)", "Facial wax", "Nose wax"],
  "Massage Services": ["Swedish massage", "Deep tissue massage", "Sports massage", "Pre-natal massage", "Aromatherapy massage", "Feet massage", "Full body massage"],
  "Manicure & Pedicure": ["Pedicure", "Manicure"],
  "Skin & Removal Services": ["Skin tag removal", "Mole removal", "Spots removal"],
  "Makeup Services": ["Bridal makeup", "Home service makeup", "Makeup (studio walk-in)"]
};
const bookingCategory = document.getElementById("bookingCategory");
const bookingService = document.getElementById("bookingService");
const bookingDate = document.getElementById("bookingDate");
if (bookingCategory && bookingService) {
  bookingCategory.addEventListener("change", () => {
    const options = serviceOptions[bookingCategory.value] || [];
    bookingService.innerHTML = '<option value="">Choose a treatment</option>' + options.map((name) => `<option value="${name.replaceAll('"', '&quot;')}">${name}</option>`).join("");
    bookingService.disabled = options.length === 0;
  });
}
if (bookingDate) {
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  bookingDate.min = localToday;
  bookingDate.addEventListener("change", () => {
    if (bookingDate.value && new Date(bookingDate.value + "T12:00:00").getDay() === 0) {
      alert("The studio is closed on Sundays. Please choose Monday to Saturday.");
      bookingDate.value = "";
    }
  });
}
document.querySelectorAll(".category-select").forEach((button) => button.addEventListener("click", () => {
  if (bookingCategory) {
    bookingCategory.value = button.dataset.category;
    bookingCategory.dispatchEvent(new Event("change"));
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  }
}));
const bookingForm = document.getElementById("bookingForm");
if (bookingForm) bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  const date = String(data.get("date"));
  const day = new Date(date + "T12:00:00").getDay();
  if (day === 0) {
    alert("The studio is closed on Sundays. Please choose Monday to Saturday.");
    return;
  }
  const message = [
    "Hello Cee Beauty Aesthetics! I'd like to request an appointment.",
    "Name: " + data.get("name"),
    "Phone: " + data.get("phone"),
    "Category: " + data.get("category"),
    "Treatment: " + data.get("service"),
    "Preferred date: " + date,
    "Preferred time: " + data.get("time"),
    data.get("notes") ? "Additional notes: " + data.get("notes") : ""
  ].filter(Boolean).join("\n");
  const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  window.open(url, "_blank", "noopener,noreferrer");
});
