export function throttle(func, timeFrame) {
  var lastTime = 0;
  return function (...args) {
    var now = new Date();
    if (now - lastTime >= timeFrame) {
      func(...args);
      lastTime = now;
      return true;
    } else {
      return false;
    }
  };
}

export function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    clearTimeout(timeout);
    if (immediate && !timeout) func.apply(context, args);
    timeout = setTimeout(function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    }, wait);
  };
}
