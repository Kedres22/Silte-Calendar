function toGregorianDate(ethiopianDate) {
  const ethYear = ethiopianDate.getFullYear();
  const ethMonth = ethiopianDate.getMonth() + 1;
  const ethDay = ethiopianDate.getDate();

  const ethEpoch = 1723856; // Julian day number of the Ethiopian epoch (August 29, 8 AD)
  const gregorianEpoch = 1721426; // Julian day number of the Gregorian epoch (January 1, 1 AD)

  const jdn = ethEpoch + 365 * (ethYear - 1) + Math.floor(ethYear / 4) + 30 * (ethMonth - 1) + ethDay - 1;
  const gregorianJdn = jdn - gregorianEpoch;

  const daysInYear = 365.25;
  const daysInMonth = 30.44;

  const gregorianYear = Math.floor(gregorianJdn / daysInYear);
  const remainingDays = gregorianJdn % daysInYear;

  const gregorianMonth = Math.floor(remainingDays / daysInMonth) + 1;
  const gregorianDay = Math.floor(remainingDays % daysInMonth) + 1;

  return new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
}

function toEthiopianDate(gregorianDate) {
  const gYear = gregorianDate.getFullYear();
  const gMonth = gregorianDate.getMonth() + 1;
  const gDay = gregorianDate.getDate();

  let ethYear = gYear - 7;
  let ethMonth = gMonth - 9;
  let ethDay = gDay + 21;

  if (ethDay > 30) {
    ethDay -= 30;
    ethMonth += 1;
  }

  if (ethMonth <= 0) {
    ethMonth += 12;
    ethYear -= 1;
  }

  if (ethMonth > 12) {
    ethMonth = 13;
    ethDay = gDay - 10;
  }

  // Adjust for Pagume
  if (ethMonth === 13) {
    const isLeapYear = ethYear % 4 === 3;
    if (ethDay > (isLeapYear ? 6 : 5)) {
      ethDay = isLeapYear ? 6 : 5;
    }
  }

  return { ethYear, ethMonth, ethDay };
}

export { toGregorianDate, toEthiopianDate };
