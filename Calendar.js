import GeezDate from './GeezDate.js';

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

export default Calendar;
