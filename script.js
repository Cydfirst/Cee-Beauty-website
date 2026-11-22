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
const yearElement = document.getElementById("year"); if (yearElement) yearElement.textContent = new Date().getFullYear();
try { const count = JSON.parse(localStorage.getItem("ceeBeautyCart") || "[]").reduce((n,x)=>n+(Number(x.qty)||1),0); document.querySelectorAll(".header-bag-count").forEach(el=>el.textContent=count); } catch {}


// Free appointment-request flow: the client sends their preferred details to Cee Beauty on WhatsApp.
const serviceOptions = {
  "Lash Extension Services": ["Lash Extension (Classic)", "Lash Extension (Hybrid)", "Lash Extension (Volume)", "Lash Extension (Mega Volume)", "Lash refill", "Lash removal", "Cluster lashes (Hybrid)", "Cluster lashes (Standard Volume)", "Cluster lashes (Heavy Volume)"],
  "Brow Services": ["Brow tint", "Nanoshading / Microshading", "Nano-blading / Nanostrokes", "Microblading", "Microblading removal"],
  "Waxing Services": ["Bikini line", "Chin waxing", "Eyebrow waxing", "Brazilian Wax", "Underarm wax", "Lower belly wax", "Tummy wax", "Lower back wax", "Bum wax", "Hollywood wax", "Full arm wax", "Half arm wax", "Full leg wax", "Half leg wax", "Full body wax (with Brazilian)", "Full body wax (without Brazilian)", "Facial wax", "Nose wax"],
  "Massage Services": ["Swedish massage", "Deep tissue massage", "Sports massage", "Pre-natal massage", "Aromatherapy massage", "Feet massage", "Full body massage"],
  "Manicure & Pedicure": ["Pedicure", "Manicure"],
  "Skin & Removal Services": ["Skin tag removal", "Mole removal", "Spots removal"],
  "Makeup Services": ["Bridal makeup", "Home service makeup", "Makeup (studio walk-in)"]
};
const bookingDate = document.getElementById("bookingDate");
const bookingServiceOptions = document.getElementById("bookingServiceOptions");
const bookingType = document.getElementById("bookingType");
const homeAddressWrap = document.getElementById("homeAddressWrap");
const bookingAddress = document.getElementById("bookingAddress");
if (bookingServiceOptions) {
  bookingServiceOptions.innerHTML = Object.entries(serviceOptions).map(([category, services]) => `<section class="booking-service-group"><h4>${category}</h4><div>${services.map(service => `<label class="booking-service-option"><input type="checkbox" name="services" value="${service.replaceAll('"','&quot;')}"><span>${service}</span></label>`).join("")}</div></section>`).join("");
}
function updateAppointmentType() {
  const selected = [...document.querySelectorAll('input[name="services"]:checked')].map(x => x.value);
  const massageSelected = selected.some(x => /massage/i.test(x));
  if (bookingType) {
    if (massageSelected) { bookingType.value = "Home service"; bookingType.disabled = true; }
    else { bookingType.disabled = false; }
  }
  if (homeAddressWrap) homeAddressWrap.hidden = !(massageSelected || bookingType?.value === "Home service");
  if (bookingAddress) bookingAddress.required = !homeAddressWrap.hidden;
}
document.querySelectorAll('input[name="services"]').forEach(input => input.addEventListener("change", updateAppointmentType));
if (bookingType) bookingType.addEventListener("change", updateAppointmentType);
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
  const category = button.dataset.category;
  document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  if (bookingServiceOptions) {
    const group = [...bookingServiceOptions.querySelectorAll(".booking-service-group")].find(x => x.querySelector("h4")?.textContent === category);
    group?.querySelector("input")?.focus();
  }
}));
const bookingForm = document.getElementById("bookingForm");
if (bookingForm) bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  const date = String(data.get("date"));
  if (new Date(date + "T12:00:00").getDay() === 0) { alert("The studio is closed on Sundays. Please choose Monday to Saturday."); return; }
  const selected = data.getAll("services");
  if (!selected.length) { alert("Please select at least one service."); return; }
  const massageSelected = selected.some(x => /massage/i.test(x));
  const appointmentType = massageSelected ? "Home service" : String(data.get("appointmentType") || "");
  if (!appointmentType) { alert("Please choose walk-in/studio or home service."); return; }
  const address = String(data.get("address") || "").trim();
  if (appointmentType === "Home service" && !address) { alert("Please enter your home service address."); return; }
  // Reserve a WhatsApp tab synchronously in the click gesture to avoid popup blockers after the API request.
  const whatsappTab = window.open("about:blank", "_blank");
  let bookingReference = "";
  const submitButton = bookingForm.querySelector('button[type="submit"]');
  if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Preparing your request…"; }
  try {
    const response = await fetch("/api/appointments", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:String(data.get("name")),phone:String(data.get("phone")),date,time:String(data.get("time")).replace(/\s*(am|pm)/i, "").replace(/^0?(\d{1,2}):(\d{2})$/, (_,h,m)=>{let hour=Number(h);const ap=String(data.get("time")).toLowerCase().includes("pm");if(hour===12)hour=ap?12:0;else if(ap)hour+=12;return String(hour).padStart(2,"0")+":"+m;}),services:selected,appointment_type:appointmentType,address,notes:String(data.get("notes")||"")})});
    const result = await response.json().catch(()=>({}));
    if (!response.ok) { if (whatsappTab && !whatsappTab.closed) whatsappTab.close(); alert(result.error || "We could not register that request. Please choose another time or contact us on WhatsApp."); if(submitButton){submitButton.disabled=false;submitButton.textContent="Send appointment request on WhatsApp ↗";} return; }
    bookingReference = result.reference || "";
  } catch (error) { console.warn("Booking request registration unavailable", error); }
  if (submitButton) { submitButton.disabled = false; submitButton.textContent = "Send appointment request on WhatsApp ↗"; }
  const message = [
    "Hello Cee Beauty Aesthetics! I'd like to request an appointment.",
    bookingReference ? "Booking reference: " + bookingReference : "",
    "Name: " + data.get("name"), "Phone: " + data.get("phone"),
    "Selected services: " + selected.join(", "),
    "Appointment type: " + appointmentType,
    appointmentType === "Home service" ? "Home service address: " + address : "",
    "Preferred date: " + date, "Preferred start time: " + data.get("time"),
    "Requested slot duration: 2 hours",
    data.get("notes") ? "Additional notes: " + data.get("notes") : ""
  ].filter(Boolean).join("\n");
  const whatsappUrl = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  if (whatsappTab && !whatsappTab.closed) { whatsappTab.opener = null; whatsappTab.location.href = whatsappUrl; }
  else window.location.assign(whatsappUrl);
});

// Apply owner-managed homepage content when settings have been saved in The Cee Shop.
if (document.getElementById("homeHeroTitle")) fetch("/api/settings", {cache:"no-store"}).then(r=>r.ok?r.json():{}).then(settings=>{ if(settings.home_title) document.getElementById("homeHeroTitle").textContent=settings.home_title; if(settings.home_subtitle) document.getElementById("homeHeroSubtitle").textContent=settings.home_subtitle; if(settings.home_image) document.getElementById("homeHeroImage").src=settings.home_image; }).catch(()=>{});
