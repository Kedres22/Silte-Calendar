// GeezDate class definition
const jOffset = 1803153;
const jdnOfEpocH = 2311768;
var message = "Provided date is not valid !";

class GeezDate {
    constructor(year, month, dayOfMonth, dayOfYear, julianDay) {
        var isValidDate = this.validate(year, month, dayOfMonth);
        try {
            if (isValidDate) {
                this.year = year;
                this.month = month;
                this.dayOfMonth = dayOfMonth;
                this.dayOfYear = dayOfYear;
                this.julianDay = julianDay;
            } else {
                throw new RangeError(message);
            }
        } catch (error) {
            console.log(error);
        }
    }
    validate(year, month, dayOfMonth) {
        var areNumbers = Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(dayOfMonth);
        if (!areNumbers) {
            message += "\n * -- Date parameters must be numbers!";
        }
        var areGreaterThanZero = month > 0 && dayOfMonth > 0;
        if (!areGreaterThanZero) {
            message += "\n * -- Month and dayOfMonth must be greater than 0!";
        }
        var isValidMonth = month <= 13;
        if (!isValidMonth) {
            message += "\n * -- Month is out of range!";
        }
        var isValidDate = this.validateDate(year, month, dayOfMonth);
        if (!isValidDate) {
            message += "\n * -- Day is out of range for the month!";
        }
        return areNumbers && areGreaterThanZero && isValidMonth && isValidDate;
    }
    validateDate(year, month, dayOfMonth) {
        if (month != 13) {
            return dayOfMonth <= 30;
        } else {
            return (year % 4 === 3 && dayOfMonth <= 6) || (year % 4 !== 3 && dayOfMonth <= 5);
        }
    }
    plusDays(days) {
        return GeezDate.jdnToGeez(this.julianDay + days);
    }
    plusYears(years) {
        return GeezDate.of(this.year + years, this.month, this.dayOfMonth);
    }
    dayOne() {
        return Math.ceil((this.julianDay - this.dayOfMonth) % 7);
    }
    dayOfWeek() {
        return Math.round((this.julianDay + 0.5) % 7) % 7;
    }
    getMaxDate() {
        if (this.month !== 13) {
            return 30;
        } else {
            return this.year % 4 === 3 ? 6 : 5;
        }
    }
    toGregorian() {
        return new Date((this.julianDay - jdnOfEpocH) * 86400000);
    }
    static jdnToGeez(jdn) {
        var r = (jdn - jOffset) % 1461;
        var n = r % 365 + Math.imul(365, (r / 1460));
        var year = Math.floor(Math.imul(4, ((jdn - jOffset) / 1461)) + r / 365 - r / 1460);
        var month = Math.floor(n / 30 + 1);
        var dayOfMonth = Math.floor(n % 30 + 1);
        var dayOfYear = Math.floor(Math.imul(month - 1, 30) + dayOfMonth);
        return new GeezDate(year, month, dayOfMonth, dayOfYear, jdn);
    }
    static toJdn(year, month, dayOfMonth) {
        return (jOffset + 365) + Math.imul(365, year - 1) + (year / 4) + Math.imul(30, month) + dayOfMonth - 31;
    }
    static now() {
        var now = new Date().valueOf();
        var res = now / 86400000;
        return this.jdnToGeez(res + jdnOfEpocH);
    }
    static from(date = Date) {
        try {
            var julianDay = Math.floor((date / 86400000) - (date.getTimezoneOffset() / 1440) + jdnOfEpocH);
            return this.jdnToGeez(julianDay);
        } catch (error) {
            console.log(new TypeError("value must be an instance of Date"));
        }
    }
    static of(year, month, dayOfMonth) {
        var dayOfYear = Math.imul(30, month - 1) + dayOfMonth;
        var jdn = this.toJdn(year, month, dayOfMonth);
        return new GeezDate(year, month, dayOfMonth, dayOfYear, jdn);
    }
}

// Calendar class definition
const currentDate = GeezDate.now();
class Calendar {
    constructor(constants) {
        this.constants = constants;
    }
    showMonth(start) {
        var thisMonth = start.month;
        var thisYear = start.year;
        var firstDay = start.dayOfWeek();
        var weekDays = this.constants.week;
        var displayedMonth = this.constants.getMonth(start.month);

        // Update header background image
        var bar = document.getElementById("calendarNav");
        bar.style.background = "url('./res/" + thisMonth + ".webp')";
        bar.style.backgroundPosition = "center";
        bar.style.backgroundSize = "cover";

        // Build the calendar grid
        start = start.plusDays(-firstDay);
        var html = "<table>";
        html += "<tr style='padding:3px;'>";
        html +=
            "<th class='weekend'>" + weekDays[0] + "</th>" +
            "<th>" + weekDays[1] + "</th>" +
            "<th>" + weekDays[2] + "</th>" +
            "<th>" + weekDays[3] + "</th>" +
            "<th>" + weekDays[4] + "</th>" +
            "<th>" + weekDays[5] + "</th>" +
            "<th class='weekend'>" + weekDays[6] + "</th></tr></table>";
        html += "<ul class='month' id='mon'>";
        for (let i = 0; i < 42; i++) {
            html += "<li class='day ";
            if (start.month === thisMonth) {
                if (i % 7 === 0 || i % 7 === 6) {
                    html += "weekend ";
                } else {
                    html += "week ";
                }
                if (
                    start.dayOfMonth === currentDate.dayOfMonth &&
                    thisMonth === currentDate.month &&
                    thisYear === currentDate.year
                ) {
                    html += "today";
                }
            } else {
                html += "offset";
            }
            html += "'>";
            html += String(start.dayOfMonth).padStart(2, "0") + "</li>";
            start = start.plusDays(1);
        }
        html += "</ul>";
        return { html: html, displayedMonth: displayedMonth, year: thisYear };
    }
}

// Constants and initialization
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

function toSecondCalendarDate(firstCalendarDate) {
    const fYear = firstCalendarDate.getFullYear();
    const fMonth = firstCalendarDate.getMonth() + 1;
    const fDay = firstCalendarDate.getDate();

    let sYear = fYear - 7;
    let sMonth, sDay;

    const newYearFC = new Date(fYear, 8, 11);
    const isLeapFC = (fYear % 4 === 0 && fYear % 100 !== 0) || (fYear % 400 === 0);
    if (isLeapFC) newYearFC.setDate(12);

    if (firstCalendarDate < newYearFC) {
        sYear -= 1;
    }

    const secondCalendarMonthStart = [
        [9, 11], [10, 11], [11, 10], [12, 10], [1, 9], [2, 8], 
        [3, 10], [4, 9], [5, 9], [6, 8], [7, 8], [8, 7], [9, 6]
    ];

    for (let i = 0; i < secondCalendarMonthStart.length; i++) {
        let [fM, fD] = secondCalendarMonthStart[i];
        if (fMonth > fM || (fMonth === fM && fDay >= fD)) {
            sMonth = i + 1;
            sDay = fDay - fD + 1;
            if (sDay < 1) sDay += 30;
        }
    }

    return { sYear, sMonth, sDay };
}

const today = new Date();
const fDay = String(today.getDate()).padStart(2, '0');
const fMonth = String(today.getMonth() + 1).padStart(2, '0');
const fYear = today.getFullYear();
const formattedFirstCalendarDate = `${fDay}-${fMonth}-${fYear}`;

const { sYear, sMonth, sDay } = toSecondCalendarDate(today);
const formattedSecondCalendarDate = `${String(sDay).padStart(2, '0')}-${String(sMonth).padStart(2, '0')}-${sYear}`;

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
// (Keep all your existing GeezDate, Calendar, Constants, etc. code above)

// ... existing code ...

// Functions to switch months (Keep these)
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

// Dark Mode Toggle (Keep this)
const toggleBtn = document.getElementById("toggle-btn");
// ... (rest of the dark mode code) ...


// --- Hamburger Menu Functionality (Add this section) ---
const hamburgerBtn = document.getElementById('hamburger-menu');

if (hamburgerBtn) { // Check if the button exists
    hamburgerBtn.addEventListener('click', () => {
        // Navigate to the menu page when the hamburger icon is clicked
        window.location.href = 'menu.html';
    });
}
// --- End of Hamburger Menu Functionality ---


// Initial render of calendar (Keep this ideally at the end)
renderCalendar();


