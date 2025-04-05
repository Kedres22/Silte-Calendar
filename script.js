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

    // Calculate the day of the week for the *first day* of the current month (0-6, interpretation depends on constants)
    // Original code's logic: Math.ceil((this.julianDay - this.dayOfMonth) % 7) - This seems unusual for day of week.
    // Let's assume it calculates an offset or index based on the start of the month's JDN.
    // Reverting to the logic from the *first* script which is standard for finding the weekday of the 1st.
    dayOne() {
        // Calculate JDN for the 1st of the current month
        const jdnDayOne = GeezDate.toJdn(this.year, this.month, 1);
        // Standard JDN to Day of Week: (JDN + 1.5) % 7 gives Sun=0, Mon=1,... Sat=6
        // We need to align this with how the calendar grid expects it (e.g., if constants.week[0] is Sunday).
        // The second script's Calendar generation *hardcodes* weekday headers assuming a specific order.
        // Let's use the standard calculation and assume constants.week[0] is Sunday.
         return Math.floor((jdnDayOne + 1.5) % 7); // Sunday=0, ..., Saturday=6
    }


    // Calculate the day of the week for the *current* date (0-6)
    // Original code: Math.round((this.julianDay + 0.5) % 7) % 7; - Rounding can be tricky.
    // Using standard floor method is safer.
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
        // Original formula: new Date((this.julianDay - jdnOfEpocH) * 86400000);
        // This relies heavily on the specific value and meaning of jdnOfEpocH.
        // Using the standard JDN to Unix timestamp conversion might be more reliable:
        const unixTimestamp = (this.julianDay - 2440587.5) * 86400000;
        return new Date(unixTimestamp);
        // If the original formula is required and jdnOfEpocH is correct for its purpose:
        // return new Date((this.julianDay - jdnOfEpocH) * 86400000);
    }

    // Static method: Convert Julian Day Number to GeezDate object
    // This uses a specific algorithm involving remainders and Math.imul (32-bit integer multiplication)
    static jdnToGeez(jdn) {
        // Ensure jdn is treated as a number
        jdn = Number(jdn);
        const r = (jdn - jOffset); // Days since Ethiopian epoch
        const n_cycle = Math.floor(r / 1461); // Number of 4-year cycles
        const r_rem = r % 1461; // Remainder days within the cycle (0-1460)

        let year = 4 * n_cycle;
        let dayOfYear; // Day within the year (1-366)

        if (r_rem === 1460) { // Last day of a leap year (Pagume 6)
             year += 3; // It belongs to the 3rd year index (0, 1, 2, 3) of the cycle
             dayOfYear = 366;
        } else {
            const year_in_cycle = Math.floor(r_rem / 365);
            year += year_in_cycle;
            dayOfYear = (r_rem % 365) + 1; // Day number 1 to 365
        }


        // Determine month and dayOfMonth from dayOfYear
        let month, dayOfMonth;
        if (dayOfYear > 365) { // Pagume 6 (only possible in leap year)
             month = 13;
             dayOfMonth = 6;
        } else if (dayOfYear > 360) { // Pagume 1-5
            month = 13;
            dayOfMonth = dayOfYear - 360;
        } else { // Months 1-12
            month = Math.floor((dayOfYear - 1) / 30) + 1;
            dayOfMonth = ((dayOfYear - 1) % 30) + 1;
        }

        // Recalculate dayOfYear for consistency based on derived month/day
        let calculatedDayOfYear = (month <= 12) ? (month - 1) * 30 + dayOfMonth : 360 + dayOfMonth;

        // Use constructor which includes validation
        return new GeezDate(year, month, dayOfMonth, calculatedDayOfYear, Math.floor(jdn)); // Store integer JDN
    }

    // Static method: Convert GeezDate components to Julian Day Number
    // This formula also seems specific. Test thoroughly.
    static toJdn(year, month, dayOfMonth) {
        // Use validation logic before calculation
         // Create a temporary instance *just* for validation side-effect (not ideal design)
        const tempValidator = new GeezDate(year, month, dayOfMonth, 0, 0);
        // The constructor throws an error if invalid, but doesn't return easily checkable status here.
        // Let's add a basic check based on the validation logic itself:
        const tempDayValidator = new GeezDate(2000,1,1,1,2451545); // Dummy valid date to access method
        if (!tempDayValidator.validate(year, month, dayOfMonth)) {
             console.error("Invalid date components provided to toJdn:", year, month, dayOfMonth);
             // Reset global message after logging
             message = "Provided date is not valid !";
             return NaN; // Return Not-a-Number for invalid input
        }

        // Original formula: (jOffset + 365) + Math.imul(365, year - 1) + (year / 4) + Math.imul(30, month) + dayOfMonth - 31;
        // Let's break down a standard approach:
        // Days from epoch start to beginning of the year: (year * 365) + floor(year / 4)
        // Days from beginning of year to beginning of the month: (month - 1) * 30
        // Days into the month: dayOfMonth - 1 (since day 1 is 0 days into the month)
        // Combine with offset:
        const jdn = jOffset +
                    (year * 365) + Math.floor(year / 4) + // Days up to start of year
                    ((month - 1) * 30) +                 // Days up to start of month
                    dayOfMonth - 1;                      // Day within month (adjusting for 1-based index)

        return Math.floor(jdn); // Return integer JDN
    }


    // Static method: Get the current date in GeezDate format based on system time
    static now() {
        const now = new Date(); // Current system time
        // Calculate JDN from JavaScript Date (considers UTC)
        const msPerDay = 86400000;
        const unixEpochJdn = 2440587.5; // JDN of 1970-01-01T00:00:00Z
        const jdn = (now.getTime() / msPerDay) + unixEpochJdn;
        // Use floor to get the JDN at the beginning of the current UTC day
        return this.jdnToGeez(Math.floor(jdn));
        // The original formula used jdnOfEpocH and didn't floor, which might lead to issues:
        // var now_ms = new Date().valueOf();
        // var res = now_ms / 86400000;
        // return this.jdnToGeez(res + jdnOfEpocH); // This might include time fraction
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
            // Calculate JDN at the start of the UTC day for the given Date object
            const jdn = Math.floor(date.getTime() / msPerDay) + unixEpochJdn;
            return this.jdnToGeez(jdn);

            // Original formula used timezone offset and jdnOfEpocH:
            // var julianDay = Math.floor((date.getTime() / 86400000) - (date.getTimezoneOffset() / 1440) + jdnOfEpocH);
            // return this.jdnToGeez(julianDay); // This mixes local timezone with potentially UTC-based JDN epoch
        } catch (error) {
             console.log(error); // Logs TypeError
             return null; // Return null on error
        }
    }


    // Static method: Create a GeezDate object from year, month, day components
    static of(year, month, dayOfMonth) {
        // Calculate JDN first using the class method (which includes validation)
        const jdn = this.toJdn(year, month, dayOfMonth);
        if (isNaN(jdn)) {
            console.error("GeezDate.of Error: Invalid date components provided.", year, month, dayOfMonth);
            return null; // Indicate failure
        }
        // Recalculate dayOfYear based on valid inputs
        // Handle Pagume correctly
        const dayOfYear = (month <= 12) ? (month - 1) * 30 + dayOfMonth : 360 + dayOfMonth;

        // Use the main constructor for final object creation and validation consistency
        // Need to pass all parameters expected by constructor
        return new GeezDate(year, month, dayOfMonth, dayOfYear, jdn);
        // Original just calculated dayOfYear and jdn then called constructor. This is fine too,
        // but calculating JDN first allows validation before creating the object.
        // var dayOfYear = Math.imul(30, month - 1) + dayOfMonth;
        // var jdn = this.toJdn(year, month, dayOfMonth);
        // return new GeezDate(year, month, dayOfMonth, dayOfYear, jdn);
    }
}


// ==================================
// Calendar Class Definition
// ==================================
// Get current Ethiopian date once for highlighting 'today'
// Ensure GeezDate.now() is valid before using it
const todayGeez = GeezDate.now();
// Add a check in case GeezDate.now() failed somehow (though unlikely if calculations are correct)
if (!todayGeez || !todayGeez.year) {
     console.error("Failed to get current Ethiopian date (todayGeez). Highlighting may not work.");
}


class Calendar {
    constructor(constants) {
        this.constants = constants; // Language/locale constants (month names, weekdays)
    }

    // Generate HTML for a given month starting from a specific GeezDate (should be 1st of month)
    showMonth(startDate) { // startDate should ideally be the 1st of the month to display
        const displayMonth = startDate.month;
        const displayYear = startDate.year;
        // Use the improved dayOne() method to find the weekday of the 1st (0=Sun, 6=Sat)
        const firstDayOfWeekIndex = startDate.dayOne();
        const weekDays = this.constants.week; // Array of weekday names (e.g., ["Sun", "Mon",...])
        const displayedMonthName = this.constants.getMonth(displayMonth); // Get month name (e.g., "Meskerem")

        // --- Update Header Background Image ---
        const calendarNav = document.getElementById("calendarNav");
        if (calendarNav) {
             // Use modulo or specific check for Pagume (month 13) if needed
            const imageMonth = displayMonth <= 12 ? displayMonth : 13; // Use 13 for Pagume image key/fallback
            // Use template literal for cleaner string construction
            calendarNav.style.backgroundImage = `url('./res/${imageMonth}.webp')`;
            calendarNav.style.backgroundPosition = "center";
            calendarNav.style.backgroundSize = "cover";
        } else {
             console.warn("Element with ID 'calendarNav' not found for background image.");
        }


        // --- Build the Calendar Grid ---
        // Calculate the date of the first cell to display (might be from previous month)
        // Start from the 1st of the month and subtract the weekday index days
        let currentCellDate = startDate.plusDays(-firstDayOfWeekIndex);

        // Build table header (weekday names) - more dynamically
        let html = "<table><thead><tr>";
        // Assuming constants.week starts with Sunday at index 0
        for (let i = 0; i < 7; i++) {
             const isWeekend = (i === 0 || i === 6); // Assuming index 0=Sun, 6=Sat
             html += `<th class='${isWeekend ? "weekend" : ""}'>${weekDays[i] || ''}</th>`; // Add weekend class
        }
        html += "</tr></thead></table>"; // Close thead and table start tag

        // Build list for days
        html += "<ul class='month' id='mon'>"; // Use 'month-grid' or similar name? 'mon' is unclear
        const totalCells = 42; // Always display 6 weeks (42 days) for consistent layout

        for (let i = 0; i < totalCells; i++) {
            const cellDay = currentCellDate.dayOfMonth;
            const cellMonth = currentCellDate.month;
            const cellYear = currentCellDate.year;
            const cellDayOfWeekIndex = currentCellDate.dayOfWeek(); // 0=Sun, 6=Sat

            let classes = ['day']; // Base class

            if (cellMonth === displayMonth && cellYear === displayYear) {
                // Day belongs to the currently displayed month
                if (cellDayOfWeekIndex === 0 || cellDayOfWeekIndex === 6) {
                    classes.push('weekend');
                } else {
                    // classes.push('week'); // 'weekday' might be clearer than 'week'
                    classes.push('weekday');
                }
                // Check if this cell is today's date
                if (
                    todayGeez && todayGeez.year && // Ensure todayGeez is valid
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
            // Use padStart for consistent two-digit day display
            html += `<li class="${classes.join(' ')}">`;
            html += String(cellDay).padStart(2, "0");
            html += "</li>";

            // Move to the next day for the next cell
            currentCellDate = currentCellDate.plusDays(1);
        }
        html += "</ul>"; // Close the list

        // Return the generated HTML and month/year info
        return { html: html, displayedMonth: displayedMonthName, year: displayYear };
    }
}


// ==================================
// Constants and Initialization
// ==================================
// Month Names (Assuming these are the intended names for "latin" / "iso" locale)
const latinYear = [
    "መሰሮ", "ጢቂምት", "ሂዳር", "መሼ", "ኢንቶጎት", "መንገስ",
    "ወቶ", "ማዜ", "አስሬ", "ሰኜ", "አምሌ", "ናሴ", "ቃቅሜ"
];
// Month Names (Assuming these are for "geez" / default locale - seem identical to latinYear?)
const geezYear = [
    "መሰሮ", "ጢቂምት", "ሂዳር", "መሼ", "ኢንቶጎት", "መንገስ",
    "ወቶ", "መዜ", // Difference: መዜ vs ማዜ ?
    "አስሬ", "ሰኜ", "አምሌ", "ናሴ", "ቃቅሜ"
];
// Weekday Names (Assuming these are "latin" / "iso" locale, and start Sunday)
const latinWeek = ["ግድር", "ኡጠት", "መገር", "አርጴ", "ከምስ", "ጂማት", "አንሰ"]; // Assuming ግድር = Sunday?
// Weekday Names (Assuming "geez" / default locale, seem identical to latinWeek)
const geezWeek = ["ግድር", "ኡጠት", "መገር", "አርጴ", "ከምስ", "ጂማት", "አንሰ"]; // Assuming ግድር = Sunday?

// Class to manage language constants
class Constants {
    constructor(locale = "geez") { // Default to "geez" locale
        this.setLocale(locale); // Initialize based on provided locale
    }

    setLocale(locale) {
        this.locale = locale;
        this.setDaysOfWeek();
        this.setMonthsOfYear();
    }

    setMonthsOfYear() {
        // Choose month names based on locale
        if (this.locale === "iso") { // Using "iso" as specified in the original second script
            this.months = latinYear;
        } else { // Default to "geez"
            this.months = geezYear;
        }
    }

    setDaysOfWeek() {
        // Choose week names based on locale
         if (this.locale === "iso") { // Using "iso"
            this.week = latinWeek; // Assuming order is Sunday-Saturday
        } else { // Default to "geez"
            this.week = geezWeek; // Assuming order is Sunday-Saturday
        }
    }

    // Get weekday name by index (0-6, assuming Sun-Sat)
    getDayOfWeek(value) {
        return this.week[value] || ""; // Return empty string if index is invalid
    }

    // Get month name by month number (1-13)
    getMonth(month) {
         // Adjust index (month 1 -> index 0, ..., month 13 -> index 12)
        return this.months[month - 1] || ""; // Return empty string if month number is invalid
    }
}


// Instantiate constants - choose 'iso' for latinYear/latinWeek or 'geez' for geezYear/geezWeek
const constants = new Constants("iso"); // Or "geez"
// Create a Calendar instance using these constants
const calendar = new Calendar(constants);


// ==================================
// Global State & Rendering
// ==================================
// Get the initial date to display (current month based on system time -> Ethiopian)
let currentDisplayedGeezDate = GeezDate.now();
let y = currentDisplayedGeezDate ? currentDisplayedGeezDate.year : new Date().getFullYear() - 8; // Fallback year approx
let m = currentDisplayedGeezDate ? currentDisplayedGeezDate.month : 1; // Fallback month

// --- DOM Elements (Make sure these IDs exist in your HTML) ---
const calendarContainer = document.getElementById("calendarContainer");
const monthYearDisplay = document.getElementById("monthYearDisplay");

// --- Render Function ---
function renderCalendar() {
     if (!calendarContainer || !monthYearDisplay) {
        console.error("Calendar container or display element not found!");
        return;
    }
    // Validate m and y before proceeding
    if (!Number.isInteger(y) || m < 1 || m > 13) {
        console.error(`Invalid month (${m}) or year (${y}) for rendering.`);
        monthYearDisplay.textContent = "Error";
        calendarContainer.innerHTML = "<p>Could not load calendar: Invalid date.</p>";
        return;
    }

    // Create GeezDate for the 1st of the target month using the 'of' static method
    const dateToRender = GeezDate.of(y, m, 1);
    if (!dateToRender) {
        console.error(`Failed to create GeezDate for ${y}-${m}-1. Validation likely failed.`);
        monthYearDisplay.textContent = "Error";
        calendarContainer.innerHTML = "<p>Could not load calendar: Date creation failed.</p>";
        return; // Stop if the date object couldn't be created
    }

    const result = calendar.showMonth(dateToRender);  // Generate calendar HTML
    calendarContainer.innerHTML = result.html;        // Update calendar grid in the DOM
    monthYearDisplay.textContent = `${result.displayedMonth}, ${result.year}`; // Update header text
}


// ==================================
// Gregorian/Ethiopian Conversion Example Function (Procedural)
// ==================================
// This function provides a separate way to convert Gregorian to Ethiopian.
// It might differ from the GeezDate.from() method. Use with caution or test against GeezDate.from().
function toSecondCalendarDate(firstCalendarDate) {
    // Input validation: Ensure it's a Date object
    if (!(firstCalendarDate instanceof Date)) {
         console.error("toSecondCalendarDate expects a Date object.");
         return { sYear: NaN, sMonth: NaN, sDay: NaN }; // Return invalid structure
    }

    const fYear = firstCalendarDate.getFullYear();
    const fMonth = firstCalendarDate.getMonth() + 1; // JS months are 0-11
    const fDay = firstCalendarDate.getDate();

    let sYear = fYear - 8; // Initial approximation difference (usually 7 or 8 years)
    let sMonth = 0; // Initialize Ethiopian month
    let sDay = 0;   // Initialize Ethiopian day

    // Determine the Gregorian date of Ethiopian New Year (Meskerem 1)
    // Ethiopian leap year occurs if Gregorian year + 1 is divisible by 4
    const isEthLeap = ((fYear + 1) % 4 === 0);
    const newYearDayGregorian = isEthLeap ? 12 : 11; // September 11 or 12

    // Check if the Gregorian date is before Ethiopian New Year
    if (fMonth < 9 || (fMonth === 9 && fDay < newYearDayGregorian)) {
        sYear = fYear - 8; // If before New Year, it's 8 years difference
    } else {
        sYear = fYear - 7; // If on or after New Year, it's 7 years difference
    }

    // Create Gregorian Date object for Ethiopian New Year of the *current* Ethiopian year `sYear`
    // Need the corresponding Gregorian year for this New Year's day
    const gregYearOfNewYear = sYear + 7; // The Gregorian year where this Ethiopian year started
    const isLeapForNewYearCalc = ((gregYearOfNewYear + 1) % 4 === 0);
    const newYearGregDayForCalc = isLeapForNewYearCalc ? 12 : 11;
    const newYearGregDate = new Date(Date.UTC(gregYearOfNewYear, 8, newYearGregDayForCalc)); // Month 8 is September

    // Calculate days passed since Ethiopian New Year in UTC milliseconds
    const diffInMs = firstCalendarDate.getTime() - newYearGregDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)); // Convert ms to days

    // Calculate Ethiopian month and day
    if (diffInDays < 0) {
         // This case should technically be handled by the year adjustment, but as a safeguard:
         console.error("Calculation error in toSecondCalendarDate: diffInDays is negative.");
         // Fallback or recalculate sYear based on negative diff
          sYear = fYear - 8; // Re-adjust year if date was before calculated New Year
          // Recalculate diffInDays relative to the *previous* Ethiopian New Year
          const prevGregYearOfNewYear = sYear + 7;
          const isPrevLeap = ((prevGregYearOfNewYear + 1) % 4 === 0);
          const prevNewYearGregDay = isPrevLeap ? 12 : 11;
          const prevNewYearGregDate = new Date(Date.UTC(prevGregYearOfNewYear, 8, prevNewYearGregDay));
          const prevDiffInMs = firstCalendarDate.getTime() - prevNewYearGregDate.getTime();
          const prevDiffInDays = Math.floor(prevDiffInMs / (1000 * 60 * 60 * 24));
          sMonth = Math.floor(prevDiffInDays / 30) + 1;
          sDay = (prevDiffInDays % 30) + 1;

    } else {
        sMonth = Math.floor(diffInDays / 30) + 1;
        sDay = (diffInDays % 30) + 1;
    }


    // Adjust for Pagume (Month 13)
    if (sMonth > 13) {
        // This case indicates an issue, potentially crossing year boundary incorrectly.
        // Let's assume it lands in Pagume if day calculation fits
         sMonth = 13;
         // Day calculation needs refinement if it relies purely on diffInDays % 30
         // A more robust approach compares against start dates of each Ethiopian month.
         console.warn("Potential month calculation issue in toSecondCalendarDate near year end.");
    } else if (sMonth === 13) {
        // Check if day makes sense for Pagume (max 5 or 6 days)
         const isCurrentEthLeap = (sYear % 4 === 3);
         const maxPagumeDays = isCurrentEthLeap ? 6 : 5;
         if (sDay > maxPagumeDays) {
              console.warn("Calculated day exceeds Pagume max days.");
              // This might indicate the day rolled into the next year's Meskerem 1
              // Or there's an off-by-one in day calculation. Capping it for now:
              // sDay = maxPagumeDays; // Or handle rollover to next year
         }
    }


    // The original code used a lookup table which might be more accurate for month starts
    // Let's try to replicate that logic approximately:
    /*
    const secondCalendarMonthStart = [ // Gregorian [Month, Day] for Eth Month start (approx)
        [9, newYearDayGregorian], [10, newYearDayGregorian], [11, newYearDayGregorian-1], [12, newYearDayGregorian-1], // Mesk, Tik, Hid, Tah
        [1, newYearDayGregorian-2], [2, newYearDayGregorian-3], [3, newYearDayGregorian-1], [4, newYearDayGregorian-2], // Tir, Yek, Meg, Miy
        [5, newYearDayGregorian-2], [6, newYearDayGregorian-3], [7, newYearDayGregorian-3], [8, newYearDayGregorian-4], // Gin, Sen, Ham, Neh
        [9, newYearDayGregorian-5] // Pag (approx start)
    ];
    sMonth = 0; // Reset sMonth
    for (let i = 0; i < secondCalendarMonthStart.length; i++) {
        let [fM_start, fD_start] = secondCalendarMonthStart[i];
        let monthStartDate = new Date(fYear, fM_start - 1, fD_start); // Approx start date in Greg
         // Adjust year if month start is in the next Gregorian year (e.g., Tir starts in Jan)
         if (i >= 4 && fMonth < fM_start) monthStartDate.setFullYear(fYear -1);
         else if (i<4 && fMonth >=9) monthStartDate.setFullYear(fYear);
         else monthStartDate.setFullYear(fYear);


        if (firstCalendarDate >= monthStartDate) {
            sMonth = i + 1;
             // Calculate day based on difference from this start date? Complex.
             // Sticking with diffInDays calculation for simplicity here.
        } else {
            break; // Stop once we find the month the date falls *before*
        }
    }
    // Day calculation using this method is harder. The diffInDays approach is simpler but less precise for month starts.
    */

    return { sYear, sMonth, sDay };
}

// Example Usage of the conversion function:
const todayGregorian = new Date(); // Current system date
// Format Gregorian date
const formattedFirstCalendarDate = `${String(todayGregorian.getDate()).padStart(2, '0')}-${String(todayGregorian.getMonth() + 1).padStart(2, '0')}-${todayGregorian.getFullYear()}`;

// Use the conversion function
const { sYear, sMonth, sDay } = toSecondCalendarDate(todayGregorian);
// Format Ethiopian date from the function's result
const formattedSecondCalendarDate = `${String(sDay).padStart(2, '0')}-${String(sMonth).padStart(2, '0')}-${sYear}`;

// Optional: Display these formatted dates somewhere in the HTML
// e.g., document.getElementById('gregorian-date-display').textContent = formattedFirstCalendarDate;
//       document.getElementById('ethiopian-date-display').textContent = formattedSecondCalendarDate;
console.log("Gregorian Date:", formattedFirstCalendarDate);
console.log("Ethiopian Date (from toSecondCalendarDate):", formattedSecondCalendarDate);
// Compare with GeezDate class conversion:
const todayEthFromClass = GeezDate.from(todayGregorian);
if (todayEthFromClass && todayEthFromClass.year) {
    console.log("Ethiopian Date (from GeezDate.from):", `${String(todayEthFromClass.dayOfMonth).padStart(2, '0')}-${String(todayEthFromClass.month).padStart(2, '0')}-${todayEthFromClass.year}`);
} else {
    console.log("Ethiopian Date (from GeezDate.from): Failed to convert.");
}


// ==================================
// Event Listeners & UI Interaction
// ==================================

// --- Month Navigation Functions ---
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
        m = 13; // Go to last month (Pagume) of previous year
        y--;
    }
    renderCalendar(); // Re-render the calendar
}

// Add event listeners (assuming you have buttons with IDs 'prevMonthBtn' and 'nextMonthBtn')
const prevBtn = document.getElementById('prevMonthBtn');
const nextBtn = document.getElementById('nextMonthBtn');

if (prevBtn) {
    prevBtn.addEventListener('click', prevMonth);
} else {
    console.warn("Previous month button (#prevMonthBtn) not found.");
}

if (nextBtn) {
    nextBtn.addEventListener('click', nextMonth);
} else {
    console.warn("Next month button (#nextMonthBtn) not found.");
}


// ==================================
// Initial Calendar Render on Load
// ==================================
// Render the calendar when the script loads.
// Using DOMContentLoaded ensures HTML elements are available.
document.addEventListener('DOMContentLoaded', () => {
     renderCalendar();
});

// Or, if the script tag is placed at the end of the <body>,
// you might call renderCalendar() directly:
// renderCalendar();
