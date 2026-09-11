const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

window.HOSTEL_ASSESS_CONFIG = Object.freeze({
  API_BASE_URL: window.HOSTEL_ASSESS_API_URL || (isLocalHost
    ? 'http://localhost:5000/api'
    : 'https://hostelassess.onrender.com/api')
});
