function isTimeNotPassed(time) {
  const currentTime = new Date();
  const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  if (time >= minutes) {
    return true;
  }
  return false;
}

function genTimes(start, end, interval) {
  const times = [];
  for (let i = start; i <= end; i += interval) {
    let hours = Math.floor(i / 60);
    const minutes = i % 60;
    let period = 'am';
    if (hours === 12) { period = 'pm'; }
    if (hours > 12) {
        hours -= 12;
        period = 'pm';
    }
    times.push(`${hours}:${minutes.toString().padStart(2, '0')} ${period}`);
  }
  return times;
}

function convertTimeToMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

module.exports = { genTimes: genTimes, isTimeNotPassed: isTimeNotPassed };