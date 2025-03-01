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

export default GeezDate;
