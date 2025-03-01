import GeezDate from './GeezDate.js';
import Calendar from './Calendar.js';
import { toEthiopianDate } from './secondCalendarDate.js';

const latinYear = [
  "መሰሮ",
  "ጢቂምት",
  "ሂዳር",
  "መሼ",
  "ኢንቶጎት",
  "መንገስ",
  "ወቶ",
  "ማዜ",
  "አስሬ",
  "ሰኜ",
  "አምሌ",
  "ናሴ",
  "ቃቅሜ"
];
const geezYear = [
  "መሰሮ",
  "ጢቂምት",
  "ሂዳር",
  "መሼ",
  "ኢንቶጎት",
  "መንገስ",
  "ወቶ",
  "መዜ",
  "አስሬ",
  "ሰኜ",
  "አምሌ",
  "ናሴ",
  "ቃቅሜ"
];
const latinWeek = ["ግድር", "ኡጠት", "መገር", "አርጴ", "ከምስ", "ጂማት", "አንሰ"];
const geezWeek = ["ግድር", "ኡጠት", "መገር", "አርጴ", "ከምስ", "ጂማት", "አንሰ"];

class Constants {
  constructor(locale) {
    this.locale = locale;
    this.setDaysOfWeek();
    this.setMonthsOfYear();
  }
  setLocale(locale) {
    this.locale = locale;
    this.setDaysOfWeek();
    this.setMonthsOfYear();
  }
  setMonthsOfYear() {
    if (this.locale === "iso") {
      this.months = latinYear;
    } else {
      this.months = geezYear;
    }
  }
  setDaysOfWeek() {
    if (this.locale === "iso") {
      this.week = latinWeek;
    } else {
      this.week = geezWeek;
    }
  }
  getDayOfWeek(value) {
    return this.week[value];
  }
  getMonth(month) {
    return this.months[month - 1];
  }
}

// Instantiate constants with desired locale ("iso" or default for geez)
const constants = new Constants("iso");
// Create a Calendar instance using these constants.
const calendar = new Calendar(constants);

// Global state for displayed month
let currentDisplayedDate = GeezDate.now(); // starting with current Ethiopian date
let y = currentDisplayedDate.year;
let m = currentDisplayedDate.month;

// Function to render the calendar and update header month/year display.
function renderCalendar() {
  const result = calendar.showMonth(GeezDate.of(y, m, 1));
  document.getElementById("calendarContainer").innerHTML = result.html;
  document.getElementById("monthYearDisplay").innerHTML = result.displayedMonth + ", " + result.year;
}

const today = new Date();
const fDay = String(today.getDate()).padStart(2, '0');
const fMonth = String(today.getMonth() + 1).padStart(2, '0');
const fYear = today.getFullYear();
const formattedFirstCalendarDate = `${fDay}-${fMonth}-${fYear}`;

const { ethYear, ethMonth, ethDay } = toEthiopianDate(today);
const formattedSecondCalendarDate = `${String(ethDay).padStart(2, '0')}-${String(ethMonth).padStart(2, '0')}-${ethYear}`;

document.getElementById("firstCalendarDate").textContent = formattedFirstCalendarDate;
document.getElementById("secondCalendarDate").textContent = formattedSecondCalendarDate;

// Functions to switch months
function nextMonth() {
  if (m < 13) {
    m = m + 1;
  } else {
    m = 1;
    y = y + 1;
  }
  renderCalendar();
}

function prevMonth() {
  if (m > 1) {
    m = m - 1;
  } else {
    m = 13;
    y = y - 1;
  }
  renderCalendar();
}

// Function to update Gregorian date in the footer
function updateGregorianDate() {
  const gregorianDate = currentDisplayedDate.toGregorian();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = gregorianDate.toLocaleDateString(undefined, options);
  document.getElementById("gregorianDate").textContent = formattedDate;
}

const toggleBtn = document.getElementById("toggle-btn");

// Check local storage for theme preference
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  toggleBtn.textContent = "☀️";
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    toggleBtn.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    toggleBtn.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

// Add event listeners for prev and next buttons
document.getElementById("prevMonth").addEventListener("click", prevMonth);
document.getElementById("nextMonth").addEventListener("click", nextMonth);

// Initial render of calendar
renderCalendar();
