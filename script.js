// script.js

// ==================================
// GeezDate Class Definition
// ==================================
const jOffset = 1803153;        // Julian day offset specific to calculation method
const jdnOfEpocH = 2311768;     // Julian Day Number of the Hijri Epoch (example, verify if used) - Seems related to Gregorian conversion logic
var message = "Provided date is not valid !"; // Default validation error message

class GeezDate {
    // Constructor for creating a GeezDate object
    constructor(year, month, dayOfMonth, dayOfYear, julianDay) {
        var isValidDate = this.validate(year, month, dayOfMonth);
        try {
            if (isValidDate) {
                this.year = year;
                this.month = month;         // 1-13 (13 = Pagume)
                this.dayOfMonth = dayOfMonth; // 1-30 (or 1-5/6 for Pagume)
                this.dayOfYear = dayOfYear;   // Day number within the year
                this.julianDay = julianDay;   // Julian Day Number
            } else {
                // Reset message before throwing error
                const currentMessage = message;
                message = "Provided date is not valid !"; // Reset for next potential error
                throw new RangeError(currentMessage);
            }
        } catch (error) {
            console.error("GeezDate Error:", error); // Log error to console
        }
    }

    // Internal validation method
    validate(year, month, dayOfMonth) {
        let valid = true;
        let errorMessages = []; // Collect specific errors

        // Check if inputs are numbers
        if (!(Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(dayOfMonth))) {
            errorMessages.push("* -- Date parameters must be integers!");
            valid = false;
        }

        // Check if month and day are positive (only if they are numbers)
        if (valid && (month <= 0 || dayOfMonth <= 0)) {
             errorMessages.push("* -- Month and dayOfMonth must be greater than 0!");
             valid = false;
        }

        // Check month range (only if month is valid so far)
        if (valid && month > 13) {
            errorMessages.push("* -- Month is out of range (should be 1-13)!");
            valid = false;
        }

        // Check day range based on month and leap year (only if other checks passed)
        if (valid && !this.isValidDayForMonth(year, month, dayOfMonth)) {
             errorMessages.push("* -- Day ("+dayOfMonth+") is out of range for month "+month+"!");
             valid = false;
        }

        // If invalid, update the global message
        if (!valid) {
             message += "\n" + errorMessages.join("\n");
        }
        return valid;
    }

    // Helper to check if day is valid for the given month/year
    isValidDayForMonth(year, month, dayOfMonth) {
        if (month < 1 || month > 13 || dayOfMonth < 1) return false; // Basic sanity check
        if (month <= 12) {
            return dayOfMonth <= 30;
        } else { // Month 13 (Pagume)
            const isLeap = (year % 4 === 3); // Ethiopian leap year rule
            return (isLeap && dayOfMonth <= 6) || (!isLeap && dayOfMonth <= 5);
        }
    }

    // Calculate GeezDate after adding a number of days
    plusDays(days) {
        return GeezDate.jdnToGeez(this.julianDay + days);
    }

    // Calculate GeezDate after adding a number of years (attempts to keep same day/month)
    plusYears(years) {
        // Note: This might result in an invalid date if the original date was Pagume 6
        // and the target year is not a leap year. The constructor validation handles this.
        return GeezDate.of(this.year + years, this.month, this.dayOfMonth);
    }

    // Calculate the day of the week for the first day of the *current* month (0=Sunday, 6=Saturday - adjust if needed)
    // This seems incorrect based on typical usage. It calculates day of week for day 1 of current month.
    // Let's keep it as is, but note it might not be what's expected. A better name might be firstDayOfWeekOfMonth.
    // It appears to be used correctly in showMonth to find the start day offset.
    dayOne() {
        // Calculate JDN for the 1st of the current month
        const jdnDayOne = GeezDate.toJdn(this.year, this.month, 1);
        // Calculate day of the week (0=Sunday, 1=Monday ... 6=Saturday) - Standard Gregorian interpretation
        // The formula (jdn + 1.5) % 7 gives Sunday=0. Check if Ethiopian week starts differently.
        // The constants array 'latinWeek' starts with "ግድር" which might correspond to Sunday.
        // Let's assume Sunday = 0 for now based on standard JDN to DoW.
        return Math.floor((jdnDayOne + 1.5) % 7); // Sunday=0, Monday=1, ..., Saturday=6
    }


    // Calculate the day of the week for the *current* date (0=Sunday, 6=Saturday)
    dayOfWeek() {
        // Standard JDN to Day of Week calculation: (JDN + 1.5) % 7
        // Floor ensures integer result. Sunday=0, Monday=1...Saturday=6
        return Math.floor((this.julianDay + 1.5) % 7);
    }

    // Get the maximum number of days in the current month
    getMaxDate() {
        if (this.month !== 13) {
            return 30; // Months 1-12 have 30 days
        } else {
            // Month 13 (Pagume) depends on leap year
            return (this.year % 4 === 3) ? 6 : 5; // 6 days in leap year, 5 otherwise
        }
    }

    // Convert the GeezDate to a JavaScript Date object (UTC)
    toGregorian() {
        // The formula seems to approximate conversion but might have offset issues.
        // Standard JDN to Unix timestamp: (JDN - 2440587.5) * 86400000
        // Using jdnOfEpocH suggests a different reference point. Test this carefully.
        // Let's use the standard conversion for potentially better accuracy.
        const unixTimestamp = (this.julianDay - 2440587.5) * 86400000;
        return new Date(unixTimestamp);
    }

    // Static method: Convert Julian Day Number to GeezDate object
    static jdnToGeez(jdn) {
        // This calculation looks specific to a particular algorithm. Ensure it's correct.
        // Based on common algorithms:
        const r = (jdn - jOffset); // Days since Ethiopian epoch
        const n = (r % 1461); // Day within 4-year cycle (0-1460)
        let year = 4 * Math.floor(r / 1461) + Math.floor(n / 365) - Math.floor(n / 1460);

        let dayOfYear = (n % 365); // Day within the year (0-364)
        if (n === 1460) dayOfYear = 365; // Handle last day of leap year correctly

        // Adjust year if day is Pagume 6 in a leap year (represented as day 365 initially)
        if (dayOfYear === 365 && (year % 4 !== 3)) {
             // This case shouldn't happen if calculations are right, but as safety:
             // console.warn("Potential issue in JDN to Geez conversion logic.");
        }

        let month, dayOfMonth;
        if (dayOfYear === 365) { // Pagume 6 (only in leap years)
            month = 13;
            dayOfMonth = 6;
        } else if (dayOfYear >= 360) { // Pagume 1-5
             month = 13;
             dayOfMonth = dayOfYear - 359; // dayOfYear 360 -> day 1, ..., 364 -> day 5
        } else { // Months 1-12
            month = Math.floor(dayOfYear / 30) + 1;
            dayOfMonth = (dayOfYear % 30) + 1;
        }

        // Recalculate dayOfYear based on derived month/day for consistency
        let calculatedDayOfYear = (month - 1) * 30 + dayOfMonth;

        return new GeezDate(year, month, dayOfMonth, calculatedDayOfYear, jdn);
    }


    // Static method: Convert GeezDate components to Julian Day Number
    static toJdn(year, month, dayOfMonth) {
        // Validate input first before calculation
        const tempDate = new GeezDate(year, month, dayOfMonth, 0, 0); // Use validation logic
        if (!tempDate.year) return NaN; // Return NaN if validation failed

        // Calculation based on common algorithms:
        const jdn = jOffset + (year * 365) + Math.floor(year / 4) + ((month - 1) * 30) + dayOfMonth -1;
        return jdn;
    }

    // Static method: Get the current date in GeezDate format based on system time
    static now() {
        // Get current UTC time
        const now = new Date();
        // Calculate Julian Day Number from JavaScript Date (considers UTC)
        const msPerDay = 86400000;
        const unixEpochJdn = 2440587.5; // JDN of 1970-01-01T00:00:00Z
        const jdn = (now.getTime() / msPerDay) + unixEpochJdn;
        return this.jdnToGeez(Math.floor(jdn)); // Use floor to get the start of the day
    }

    // Static method: Convert a JavaScript Date object to GeezDate
    static from(date = new Date()) { // Default to current time if no date provided
        try {
            if (!(date instanceof Date)) {
                throw new TypeError("Input must be an instance of Date");
            }
             // Calculate Julian Day Number from JavaScript Date (considers UTC)
            const msPerDay = 86400000;
            const unixEpochJdn = 2440587.5;
            const jdn = (date.getTime() / msPerday) + unixEpochJdn;
            return this.jdnToGeez(Math.floor(jdn));
        } catch (error) {
            console.error("GeezDate.from Error:", error);
            return null; // Return null or handle error as appropriate
        }
    }

    // Static method: Create a GeezDate object from year, month, day components
    static of(year, month, dayOfMonth) {
        // Calculate JDN first
        const jdn = this.toJdn(year, month, dayOfMonth);
        if (isNaN(jdn)) {
            console.error("GeezDate.of Error: Invalid date components provided.");
            return null; // Indicate failure
        }
        // Recalculate dayOfYear based on valid inputs
        const dayOfYear = (month - 1) * 30 + dayOfMonth;
        // Create the object using the constructor for validation
        return new GeezDate(year, month, dayOfMonth, dayOfYear, jdn);
    }
}


// ==================================
// Calendar Class Definition
// ==================================
// Get current date once for highlighting today
const todayGeez = GeezDate.now(); // Use the static now() method

class Calendar {
    constructor(constants) {
        this.constants = constants; // Language/locale constants (month names, weekdays)
    }

    // Generate HTML for a given month starting from a specific GeezDate
    showMonth(startDate) { // startDate should be the 1st of the month to display
        const displayMonth = startDate.month;
        const displayYear = startDate.year;
        const firstDayOfWeek = startDate.dayOne(); // Get weekday of the 1st (0=Sun, 6=Sat)
        const weekDays = this.constants.week;
        const displayedMonthName = this.constants.getMonth(displayMonth);

        // --- Update Header Background Image ---
        const calendarNav = document.getElementById("calendarNav");
        if (calendarNav) {
            // Use modulo for Pagume to potentially reuse an image or have a default
            const imageMonth = displayMonth <= 12 ? displayMonth : 13; // Use 13 for Pagume image key
            calendarNav.style.backgroundImage = `url('./res/${imageMonth}.webp')`;
            calendarNav.style.backgroundPosition = "center";
            calendarNav.style.backgroundSize = "cover";
        }

        // --- Build the Calendar Grid ---
        // Calculate the JDN of the first cell to display (might be from previous month)
        let currentCellDate = startDate.plusDays(-firstDayOfWeek);

        // Build table header (weekday names)
        let html = "<table><thead><tr>";
        // Map constants.week array indices (0-6) to match dayOfWeek() result (0=Sun, 6=Sat)
        // Assuming constants.week[0] is Sunday, constants.week[6] is Saturday. Adjust if needed.
        for (let i = 0; i < 7; i++) {
             const dayIndex = i; // Direct mapping assuming week array starts Sunday
             const isWeekend = (dayIndex === 0 || dayIndex === 6); // Sunday or Saturday
             html += `<th class='${isWeekend ? "weekend" : ""}'>${weekDays[dayIndex]}</th>`;
        }
        html += "</tr></thead></table>";

        // Build list for days
        html += "<ul class='month' id='mon'>";
        const totalCells = 42; // Always display 6 weeks for consistency

        for (let i = 0; i < totalCells; i++) {
            const cellDay = currentCellDate.dayOfMonth;
            const cellMonth = currentCellDate.month;
            const cellYear = currentCellDate.year;
            const cellDayOfWeek = currentCellDate.dayOfWeek(); // 0=Sun, 6=Sat

            let classes = ['day']; // Base class

            if (cellMonth === displayMonth) {
                // Day belongs to the currently displayed month
                if (cellDayOfWeek === 0 || cellDayOfWeek === 6) {
                    classes.push('weekend');
                } else {
                    classes.push('week'); // Maybe rename this class? 'weekday'?
                }
                // Check if this cell is today's date
                if (
                    todayGeez && // Ensure todayGeez is valid
                    cellDay === todayGeez.dayOfMonth &&
                    cellMonth === todayGeez.month &&
                    cellYear === todayGeez.year
                ) {
                    classes.push('today');
                }
            } else {
                // Day is offset (belongs to previous or next month)
                classes.push('offset');
            }

            // Add list item with calculated classes and day number
            html += `<li class="${classes.join(' ')}">`;
            html += String(cellDay).padStart(2, "0"); // Format day with leading zero
            html += "</li>";

            // Move to the next day for the next cell
            currentCellDate = currentCellDate.plusDays(1);
        }
        html += "</ul>";

        return { html: html, displayedMonth: displayedMonthName, year: displayYear };
    }
}

// ==================================
// Constants and Initialization
// ==================================
// Define month and week names (Using Amharic names as placeholders - replace if needed)
const amharicMonths = [
    "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት",
    "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜን"
];
const amharicWeek = ["እሑድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "ዓርብ", "ቅዳሜ"]; // Sun - Sat

// Constants provided in original script (Latin names?) - Verify these correspond to the calendar logic
const latinYear = [ // Assuming these map 1-13
    "መሰሮ", "ጢቂምት", "ሂዳር", "መሼ", "ኢንቶጎት", "መንገስ",
    "ወቶ", "ማዜ", "አስሬ", "ሰኜ", "አምሌ", "ናሴ", "ቃቅሜ"
];
const latinWeek = ["ግድር", "ኡጠት", "መገር", "አርጴ", "ከምስ", "ጂማት", "አንሰ"]; // Assuming Sun-Sat mapping

// Class to manage language constants
class Constants {
    constructor(locale = "am") { // Default to Amharic or the provided 'latin' set
        this.setLocale(locale);
    }

    setLocale(locale) {
        this.locale = locale;
        this.setDaysOfWeek();
        this.setMonthsOfYear();
    }

    setMonthsOfYear() {
        // Choose month names based on locale
        if (this.locale === "am") {
            this.months = amharicMonths;
        } else if (this.locale === "latin") { // Use the 'latin' set provided
            this.months = latinYear;
        } else {
            this.months = amharicMonths; // Default fallback
        }
    }

    setDaysOfWeek() {
        // Choose week names based on locale
         if (this.locale === "am") {
            this.week = amharicWeek; // Sunday - Saturday
        } else if (this.locale === "latin") {
             // Assuming 'latinWeek' also maps Sunday(0) to Saturday(6)
             // Adjust indices if 'ግድር' is not Sunday
            this.week = latinWeek;
        } else {
            this.week = amharicWeek; // Default fallback
        }
    }

    // Get weekday name by index (0-6)
    getDayOfWeek(value) {
        return this.week[value] || ""; // Return empty string if index is invalid
    }

    // Get month name by month number (1-13)
    getMonth(month) {
        return this.months[month - 1] || ""; // Adjust index (0-12)
    }
}

// Instantiate constants - choose 'am' for Amharic or 'latin' for the other set
const constants = new Constants("latin"); // Or "am"
// Create a Calendar instance
const calendar = new Calendar(constants);

// ==================================
// Global State & Rendering
// ==================================
// Get the initial date to display (current month based on system time)
let currentDisplayedDate = GeezDate.now();
let y = currentDisplayedDate.year;
let m = currentDisplayedDate.month;

// --- DOM Elements ---
const calendarContainer = document.getElementById("calendarContainer");
const monthYearDisplay = document.getElementById("monthYearDisplay");
const toggleBtn = document.getElementById("toggle-btn");
const hamburgerBtn = document.getElementById('hamburger-menu'); // Get hamburger button

// --- Render Function ---
function renderCalendar() {
    if (!calendarContainer || !monthYearDisplay) {
        console.error("Calendar container or display element not found!");
        return;
    }
     // Ensure m and y are valid before creating the date
     if (m < 1 || m > 13 || !Number.isInteger(y)) {
        console.error(`Invalid month (${m}) or year (${y}) for rendering.`);
        // Optionally display an error message to the user
        monthYearDisplay.textContent = "Error";
        calendarContainer.innerHTML = "<p>Could not load calendar data.</p>";
        return;
     }

    const dateToRender = GeezDate.of(y, m, 1); // Create GeezDate for the 1st of the target month
     if (!dateToRender) {
          console.error(`Failed to create GeezDate for ${y}-${m}-1`);
          // Handle error appropriately, maybe show message in UI
          return;
     }
    const result = calendar.showMonth(dateToRender); // Generate calendar HTML
    calendarContainer.innerHTML = result.html;        // Update calendar grid
    monthYearDisplay.textContent = `${result.displayedMonth}, ${result.year}`; // Update header text
}


// ==================================
// Gregorian/Ethiopian Conversion Example (Not used in calendar display)
// ==================================
/*
// This function seems to attempt a specific Gregorian to Ethiopian conversion.
// It differs significantly from the GeezDate class logic. Review its necessity.
function toSecondCalendarDate(firstCalendarDate) {
    // ... (original function code) ...
    // It seems complex and might not be needed if GeezDate.from(gregorianDate) works.
}

const todayGregorian = new Date(); // Current system date
const { sYear, sMonth, sDay } = toSecondCalendarDate(todayGregorian); // Use the conversion function
// Format dates (example)
const formattedFirstCalendarDate = `${String(todayGregorian.getDate()).padStart(2, '0')}-${String(todayGregorian.getMonth() + 1).padStart(2, '0')}-${todayGregorian.getFullYear()}`;
const formattedSecondCalendarDate = `${String(sDay).padStart(2, '0')}-${String(sMonth).padStart(2, '0')}-${sYear}`;
// Could display these somewhere if needed, e.g., in the footer
// document.getElementById('current-gregorian-date').textContent = `Gregorian: ${formattedFirstCalendarDate}`;
// document.getElementById('current-ethiopian-date').textContent = `Ethiopian: ${formattedSecondCalendarDate}`;
*/

// ==================================
// Event Listeners & UI Interaction
// ==================================

// --- Month Navigation ---
function nextMonth() {
    if (m < 13) {
        m++; // Go to next month
    } else {
        m = 1; // Go to first month of next year
        y++;
    }
    renderCalendar(); // Re-render the calendar
}

function prevMonth() {
    if (m > 1) {
        m--; // Go to previous month
    } else {
        m = 13; // Go to last month of previous year
        y--;
    }
    renderCalendar(); // Re-render the calendar
}

// --- Dark Mode Toggle ---
if (toggleBtn) {
    // Check local storage for theme preference on load
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        toggleBtn.textContent = "☀️"; // Sun icon for dark mode
        toggleBtn.title = "Switch to Light Mode";
    } else {
         toggleBtn.textContent = "🌙"; // Moon icon for light mode
         toggleBtn.title = "Switch to Dark Mode";
    }

    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        // Update button text/icon and local storage
        if (document.body.classList.contains("dark-mode")) {
            toggleBtn.textContent = "☀️";
            toggleBtn.title = "Switch to Light Mode";
            localStorage.setItem("theme", "dark");
        } else {
            toggleBtn.textContent = "🌙";
             toggleBtn.title = "Switch to Dark Mode";
            localStorage.setItem("theme", "light");
        }
    });
} else {
    console.warn("Dark mode toggle button (#toggle-btn) not found.");
}


// --- Hamburger Menu Functionality ---
if (hamburgerBtn) { // Check if the button exists in the DOM
    hamburgerBtn.addEventListener('click', () => {
        // Navigate to the menu page when the hamburger icon is clicked
        window.location.href = 'menu.html';
    });
} else {
     console.warn("Hamburger menu button (#hamburger-menu) not found.");
}

// ==================================
// Initial Calendar Render on Load
// ==================================
// Ensure the DOM is fully loaded before rendering the initial calendar
// This is generally good practice, though may not be strictly necessary
// if the script tag is at the end of the body.
document.addEventListener('DOMContentLoaded', () => {
     renderCalendar();
});

// If you don't want to wait for DOMContentLoaded (e.g., script is at end of body):
// renderCalendar(); // Call directly
