// script.js

// ==================================
// GeezDate Class Definition
// ==================================
const jOffset = 1803153;        // Julian day offset specific to calculation method
const jdnOfEpocH = 2311768;     // Julian Day Number assumed for Gregorian conversion start (verify usage)
var message = "Provided date is not valid !"; // Global message for validation errors (less ideal than instance-specific errors)

class GeezDate {
    // Constructor for creating a GeezDate object
    constructor(year, month, dayOfMonth, dayOfYear, julianDay) {
        var isValidDate = this.validate(year, month, dayOfMonth);
        try {
            if (isValidDate) {
                this.year = year;
                this.month = month;         // 1-13 (13 = Pagume)
                this.dayOfMonth = dayOfMonth; // 1-30 (or 1-5/6 for Pagume)
                this.dayOfYear = dayOfYear;   // Day number within the year (calculated)
                this.julianDay = julianDay;   // Julian Day Number
            } else {
                 // Reset message before throwing error
                const currentMessage = message;
                message = "Provided date is not valid !"; // Reset for next potential error
                throw new RangeError(currentMessage);
            }
        } catch (error) {
            // Logs the error, but the object might be partially uninitialized or invalid
            console.log(error);
        }
    }

    // Internal validation method (modifies global 'message')
    validate(year, month, dayOfMonth) {
        var areNumbers = Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(dayOfMonth);
        if (!areNumbers) {
            message += "\n * -- Date parameters must be numbers!"; // Appends to global message
        }
        var areGreaterThanZero = month > 0 && dayOfMonth > 0;
        if (!areGreaterThanZero) {
            message += "\n * -- Month and dayOfMonth must be greater than 0!"; // Appends
        }
        var isValidMonth = month <= 13;
        if (!isValidMonth) {
            message += "\n * -- Month is out of range!"; // Appends
        }
        var isValidDay = this.validateDayForMonth(year, month, dayOfMonth); // Changed name for clarity
        if (!isValidDay) {
            message += "\n * -- Day is out of range for the month!"; // Appends
        }
        // Returns true only if all checks pass
        return areNumbers && areGreaterThanZero && isValidMonth && isValidDay;
    }

    // Helper to check if day is valid for the given month/year (renamed from validateDate)
    validateDayForMonth(year, month, dayOfMonth) {
        if (month < 1 || month > 13 || dayOfMonth < 1) return false; // Basic sanity check
        if (month <= 12) { // Months 1-12
            return dayOfMonth <= 30;
        } else { // Month 13 (Pagume)
            // Ethiopian leap year rule: year divisible by 4 leaves remainder 3
            const isLeap = (year % 4 === 3);
            return (isLeap && dayOfMonth <= 6) || (!isLeap && dayOfMonth <= 5);
        }
    }

    // Calculate GeezDate after adding a number of days
    plusDays(days) {
        // Uses the static conversion method with the adjusted Julian Day
        return GeezDate.jdnToGeez(this.julianDay + days);
    }

    // Calculate GeezDate after adding a number of years
    plusYears(years) {
        // Creates a new date. Note: This might be invalid if original date was Pagume 6
        // and the target year isn't a leap year. The constructor validation handles this.
        return GeezDate.of(this.year + years, this.month, this.dayOfMonth);
    }

    // Calculate the day of the week for the *first day* of the current month (0=Sun, 6=Sat)
    dayOne() {
        // Calculate JDN for the 1st of the current month
        const jdnDayOne = GeezDate.toJdn(this.year, this.month, 1);
         // Standard JDN to Day of Week: (JDN + 1.5) % 7 gives Sun=0, Mon=1,... Sat=6
        return Math.floor((jdnDayOne + 1.5) % 7);
    }


    // Calculate the day of the week for the *current* date (0=Sun, 6=Sat)
    dayOfWeek() {
        // Standard JDN to Day of Week: (JDN + 1.5) % 7 -> Sun=0, Mon=1,... Sat=6
        return Math.floor((this.julianDay + 1.5) % 7);
    }


    // Get the maximum number of days in the current month
    getMaxDate() {
        if (this.month !== 13) {
            return 30; // Months 1-12 always have 30 days
        } else {
            // Month 13 (Pagume) depends on leap year
            return (this.year % 4 === 3) ? 6 : 5; // 6 days if leap, 5 otherwise
        }
    }

    // Convert the GeezDate to a JavaScript Date object (UTC)
    toGregorian() {
        // Using the standard JDN to Unix timestamp conversion
        const unixTimestamp = (this.julianDay - 2440587.5) * 86400000;
        return new Date(unixTimestamp);
    }

    // Static method: Convert Julian Day Number to GeezDate object
    static jdnToGeez(jdn) {
        jdn = Number(jdn);
        const r = (jdn - jOffset);
        const n_cycle = Math.floor(r / 1461);
        const r_rem = r % 1461;

        let year = 4 * n_cycle;
        let dayOfYear;

        if (r_rem === 1460) {
             year += 3;
             dayOfYear = 366;
        } else {
            const year_in_cycle = Math.floor(r_rem / 365);
            year += year_in_cycle;
            dayOfYear = (r_rem % 365) + 1;
        }

        let month, dayOfMonth;
        if (dayOfYear > 365) {
             month = 13;
             dayOfMonth = 6;
        } else if (dayOfYear > 360) {
            month = 13;
            dayOfMonth = dayOfYear - 360;
        } else {
            month = Math.floor((dayOfYear - 1) / 30) + 1;
            dayOfMonth = ((dayOfYear - 1) % 30) + 1;
        }

        let calculatedDayOfYear = (month <= 12) ? (month - 1) * 30 + dayOfMonth : 360 + dayOfMonth;
        return new GeezDate(year, month, dayOfMonth, calculatedDayOfYear, Math.floor(jdn));
    }

    // Static method: Convert GeezDate components to Julian Day Number
    static toJdn(year, month, dayOfMonth) {
        const tempDayValidator = new GeezDate(2000,1,1,1,2451545); // Dummy valid date to access method
        if (!tempDayValidator.validate(year, month, dayOfMonth)) {
             console.error("Invalid date components provided to toJdn:", year, month, dayOfMonth);
             message = "Provided date is not valid !"; // Reset global message
             return NaN;
        }

        const jdn = jOffset +
                    (year * 365) + Math.floor(year / 4) +
                    ((month - 1) * 30) +
                    dayOfMonth - 1;
        return Math.floor(jdn);
    }


    // Static method: Get the current date in GeezDate format based on system time
    static now() {
        const now = new Date();
        const msPerDay = 86400000;
        const unixEpochJdn = 2440587.5;
        const jdn = (now.getTime() / msPerDay) + unixEpochJdn;
        return this.jdnToGeez(Math.floor(jdn));
    }

    // Static method: Convert a JavaScript Date object to GeezDate
    static from(date = new Date()) {
        try {
             if (!(date instanceof Date)) {
                throw new TypeError("Input must be an instance of Date");
            }
            const msPerDay = 86400000;
            const unixEpochJdn = 2440587.5;
            const jdn = Math.floor(date.getTime() / msPerDay) + unixEpochJdn;
            return this.jdnToGeez(jdn);
        } catch (error) {
             console.log(error);
             return null;
        }
    }


    // Static method: Create a GeezDate object from year, month, day components
    static of(year, month, dayOfMonth) {
        const jdn = this.toJdn(year, month, dayOfMonth);
        if (isNaN(jdn)) {
            console.error("GeezDate.of Error: Invalid date components provided.", year, month, dayOfMonth);
            return null;
        }
        const dayOfYear = (month <= 12) ? (month - 1) * 30 + dayOfMonth : 360 + dayOfMonth;
        return new GeezDate(year, month, dayOfMonth, dayOfYear, jdn);
    }
}


// ==================================
// Calendar Class Definition
// ==================================
const todayGeez = GeezDate.now();
if (!todayGeez || !todayGeez.year) {
     console.error("Failed to get current Ethiopian date (todayGeez). Highlighting may not work.");
}


class Calendar {
    constructor(constants) {
        this.constants = constants;
    }

    // Generate HTML for a given month starting from a specific GeezDate (should be 1st of month)
    showMonth(startDate) {
        const displayMonth = startDate.month;
        const displayYear = startDate.year;
        const firstDayOfWeekIndex = startDate.dayOne();
        const weekDays = this.constants.week;
        const displayedMonthName = this.constants.getMonth(displayMonth);

        // --- Update Header Background Image ---
        const calendarNav = document.getElementById("calendarNav");
        if (calendarNav) {
            const imageMonth = displayMonth <= 12 ? displayMonth : 13;
            calendarNav.style.backgroundImage = `url('./res/${imageMonth}.webp')`;
            calendarNav.style.backgroundPosition = "center";
            calendarNav.style.backgroundSize = "cover";
        } else {
             console.warn("Element with ID 'calendarNav' not found for background image.");
        }


        // --- Build the Calendar Grid ---
        let currentCellDate = startDate.plusDays(-firstDayOfWeekIndex);
        let html = "<table><thead><tr>";
        for (let i = 0; i < 7; i++) {
             const isWeekend = (i === 0 || i === 6); // Assuming index 0=Sun, 6=Sat
             html += `<th class='${isWeekend ? "weekend" : ""}'>${weekDays[i] || ''}</th>`;
        }
        html += "</tr></thead></table>";

        html += "<ul class='month' id='mon'>";
        const totalCells = 42;

        for (let i = 0; i < totalCells; i++) {
            const cellDay = currentCellDate.dayOfMonth;
            const cellMonth = currentCellDate.month;
            const cellYear = currentCellDate.year;
            const cellDayOfWeekIndex = currentCellDate.dayOfWeek();

            let classes = ['day'];

            if (cellMonth === displayMonth && cellYear === displayYear) {
                if (cellDayOfWeekIndex === 0 || cellDayOfWeekIndex === 6) {
                    classes.push('weekend');
                } else {
                    classes.push('weekday');
                }
                if (
                    todayGeez && todayGeez.year &&
                    cellDay === todayGeez.dayOfMonth &&
                    cellMonth === todayGeez.month &&
                    cellYear === todayGeez.year
                ) {
                    classes.push('today');
                }
            } else {
                classes.push('offset');
            }

            html += `<li class="${classes.join(' ')}">`;
            html += String(cellDay).padStart(2, "0");
            html += "</li>";

            currentCellDate = currentCellDate.plusDays(1);
        }
        html += "</ul>";

        return { html: html, displayedMonth: displayedMonthName, year: displayYear };
    }
}


// ==================================
// Constants and Initialization
// ==================================
const latinYear = [
    "መሰሮ", "ጢቂምት", "ሂዳር", "መሼ", "ኢንቶጎት", "መንገስ",
    "ወቶ", "ማዜ", "አስሬ", "ሰኜ", "አምሌ", "ናሴ", "ቃቅሜ"
];
const geezYear = [
    "መሰሮ", "ጢቂምት", "ሂዳር", "መሼ", "ኢንቶጎት", "መንገስ",
    "ወቶ", "መዜ", // Difference: መዜ vs ማዜ ?
    "አስሬ", "ሰኜ", "አምሌ", "ናሴ", "ቃቅሜ"
];
const latinWeek = ["ግድር", "ኡጠት", "መገር", "አርጴ", "ከምስ", "ጂማት", "አንሰ"]; // Assuming Sun-Sat
const geezWeek = ["ግድር", "ኡጠት", "መገር", "አርጴ", "ከምስ", "ጂማት", "አንሰ"]; // Assuming Sun-Sat

class Constants {
    constructor(locale = "geez") {
        this.setLocale(locale);
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
    getDayOfWeek(value) { return this.week[value] || ""; }
    getMonth(month) { return this.months[month - 1] || ""; }
}

const constants = new Constants("iso"); // Or "geez"
const calendar = new Calendar(constants);


// ==================================
// Global State & Rendering
// ==================================
let currentDisplayedGeezDate = GeezDate.now();
let y = currentDisplayedGeezDate ? currentDisplayedGeezDate.year : new Date().getFullYear() - 8;
let m = currentDisplayedGeezDate ? currentDisplayedGeezDate.month : 1;

// --- DOM Elements ---
const calendarContainer = document.getElementById("calendarContainer");
const monthYearDisplay = document.getElementById("monthYearDisplay");
const prevBtn = document.getElementById('prevMonthBtn'); // Added for clarity
const nextBtn = document.getElementById('nextMonthBtn'); // Added for clarity
const toggleBtn = document.getElementById("toggle-btn"); // Added for dark mode
const hamburgerBtn = document.getElementById('hamburger-menu'); // Added for menu

// --- Render Function ---
function renderCalendar() {
     if (!calendarContainer || !monthYearDisplay) {
        console.error("Calendar container or display element not found!");
        return;
    }
    if (!Number.isInteger(y) || m < 1 || m > 13) {
        console.error(`Invalid month (${m}) or year (${y}) for rendering.`);
        monthYearDisplay.textContent = "Error";
        calendarContainer.innerHTML = "<p>Could not load calendar: Invalid date.</p>";
        return;
    }

    const dateToRender = GeezDate.of(y, m, 1);
    if (!dateToRender) {
        console.error(`Failed to create GeezDate for ${y}-${m}-1. Validation likely failed.`);
        monthYearDisplay.textContent = "Error";
        calendarContainer.innerHTML = "<p>Could not load calendar: Date creation failed.</p>";
        return;
    }

    const result = calendar.showMonth(dateToRender);
    calendarContainer.innerHTML = result.html;
    monthYearDisplay.textContent = `${result.displayedMonth}, ${result.year}`;
}


// ==================================
// Gregorian/Ethiopian Conversion Example Function (Procedural)
// ==================================
function toSecondCalendarDate(firstCalendarDate) {
    if (!(firstCalendarDate instanceof Date)) {
         console.error("toSecondCalendarDate expects a Date object.");
         return { sYear: NaN, sMonth: NaN, sDay: NaN };
    }
    const fYear = firstCalendarDate.getFullYear();
    const fMonth = firstCalendarDate.getMonth() + 1;
    const fDay = firstCalendarDate.getDate();

    let sYear, sMonth, sDay;
    const isEthLeap = ((fYear + 1) % 4 === 0);
    const newYearDayGregorian = isEthLeap ? 12 : 11;

    if (fMonth < 9 || (fMonth === 9 && fDay < newYearDayGregorian)) {
        sYear = fYear - 8;
    } else {
        sYear = fYear - 7;
    }

    const gregYearOfNewYear = sYear + 7;
    const isLeapForNewYearCalc = ((gregYearOfNewYear + 1) % 4 === 0);
    const newYearGregDayForCalc = isLeapForNewYearCalc ? 12 : 11;
    const newYearGregDate = new Date(Date.UTC(gregYearOfNewYear, 8, newYearGregDayForCalc));

    const diffInMs = firstCalendarDate.getTime() - newYearGregDate.getTime();
    let diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) { // Handle cases before calculated new year (should be covered by year adjustment)
         console.warn("Recalculating based on negative diffInDays in toSecondCalendarDate");
         // Assume it belongs to the previously calculated year (sYear should be correct)
         // Find the *previous* New Year's Gregorian date
          const prevGregYearOfNewYear = sYear + 7; // Year calculation already adjusted
          const isPrevLeap = ((prevGregYearOfNewYear + 1) % 4 === 0);
          const prevNewYearGregDay = isPrevLeap ? 12 : 11;
          const prevNewYearGregDate = new Date(Date.UTC(prevGregYearOfNewYear, 8, prevNewYearGregDay));
          const prevDiffInMs = firstCalendarDate.getTime() - prevNewYearGregDate.getTime();
          diffInDays = Math.floor(prevDiffInMs / (1000 * 60 * 60 * 24)); // Use diff relative to the correct starting New Year
    }

    sMonth = Math.floor(diffInDays / 30) + 1;
    sDay = (diffInDays % 30) + 1;

    if (sMonth === 13) {
         const isCurrentEthLeap = (sYear % 4 === 3);
         const maxPagumeDays = isCurrentEthLeap ? 6 : 5;
         if (sDay > maxPagumeDays) {
              console.warn(`Calculated day ${sDay} exceeds Pagume max days (${maxPagumeDays}). Adjusting.`);
              // This likely means it rolled over to the next year's Meskerem 1
              sYear++;
              sMonth = 1;
              sDay = 1; // Or calculate exact day if needed: sDay - maxPagumeDays
         }
    } else if (sMonth > 13) {
        console.warn(`Calculated month ${sMonth} is invalid. Adjusting.`);
        // Simple rollover:
        sYear++;
        sMonth = 1;
        sDay = (diffInDays - (12 * 30)) % 30 + 1; // Approx day in new year's Meskerem
    }

    return { sYear, sMonth, sDay };
}

// Example Usage (logging to console)
const todayGregorian = new Date();
const formattedFirstCalendarDate = `${String(todayGregorian.getDate()).padStart(2, '0')}-${String(todayGregorian.getMonth() + 1).padStart(2, '0')}-${todayGregorian.getFullYear()}`;
const { sYear, sMonth, sDay } = toSecondCalendarDate(todayGregorian);
const formattedSecondCalendarDate = `${String(sDay).padStart(2, '0')}-${String(sMonth).padStart(2, '0')}-${sYear}`;
console.log("Gregorian Date:", formattedFirstCalendarDate);
console.log("Ethiopian Date (from toSecondCalendarDate):", formattedSecondCalendarDate);
const todayEthFromClass = GeezDate.from(todayGregorian);
if (todayEthFromClass && todayEthFromClass.year) {
    console.log("Ethiopian Date (from GeezDate.from):", `${String(todayEthFromClass.dayOfMonth).padStart(2, '0')}-${String(todayEthFromClass.month).padStart(2, '0')}-${todayEthFromClass.year}`);
} else {
    console.log("Ethiopian Date (from GeezDate.from): Failed to convert.");
}


// ==================================
// Event Listeners & UI Interaction
// ==================================

// --- Month Navigation ---
function nextMonth() {
    if (m < 13) { m++; } else { m = 1; y++; }
    renderCalendar();
}
function prevMonth() {
    if (m > 1) { m--; } else { m = 13; y--; }
    renderCalendar();
}
// Attach listeners
if (prevBtn) {
    prevBtn.addEventListener('click', prevMonth);
} else { console.warn("Previous month button (#prevMonthBtn) not found."); }
if (nextBtn) {
    nextBtn.addEventListener('click', nextMonth);
} else { console.warn("Next month button (#nextMonthBtn) not found."); }


// --- Dark Mode Toggle --- [ADDED BACK]
if (toggleBtn) { // Check if the button exists
    // Check local storage for theme preference on load
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        toggleBtn.textContent = "☀️"; // Sun icon for dark mode
        toggleBtn.title = "Switch to Light Mode";
    } else {
         // Default to light mode if no preference stored or value is not 'dark'
         toggleBtn.textContent = "🌙"; // Moon icon for light mode
         toggleBtn.title = "Switch to Dark Mode";
    }

    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        // Update button text/icon, title, and local storage
        if (document.body.classList.contains("dark-mode")) {
            toggleBtn.textContent = "☀️";
            toggleBtn.title = "Switch to Light Mode";
            localStorage.setItem("theme", "dark");
        } else {
            toggleBtn.textContent = "🌙";
            toggleBtn.title = "Switch to Dark Mode";
            localStorage.setItem("theme", "light");
        }
    }); // <-- Added missing closing parenthesis and curly brace here
} else {
    console.warn("Dark mode toggle button (#toggle-btn) not found.");
}


// --- Hamburger Menu Functionality --- [ADDED BACK]
if (hamburgerBtn) { // Check if the button exists in the DOM
    hamburgerBtn.addEventListener('click', () => {
        // Navigate to the menu page when the hamburger icon is clicked
        window.location.href = 'menu.html'; // Make sure 'menu.html' exists at the correct path
    });
} else {
     console.warn("Hamburger menu button (#hamburger-menu) not found.");
}


// ==================================
// Initial Calendar Render on Load
// ==================================
// Use DOMContentLoaded to ensure all elements are loaded before trying to manipulate them
document.addEventListener('DOMContentLoaded', () => {
     renderCalendar(); // Render the initial calendar view
});
