window.HostelAPI = (() => {
  const sessionKey = 'hostelAssessToken';
  const persistentKey = 'hostelAssessPersistentToken';
  const getToken = () => sessionStorage.getItem(sessionKey) || localStorage.getItem(persistentKey);
  const setToken = (token, remember = false) => {
    sessionStorage.removeItem(sessionKey); localStorage.removeItem(persistentKey);
    (remember ? localStorage : sessionStorage).setItem(remember ? persistentKey : sessionKey, token);
  };
  const clearToken = () => { sessionStorage.removeItem(sessionKey); localStorage.removeItem(persistentKey); };

  async function request(path, options = {}) {
    const headers = { Accept: 'application/json', ...options.headers };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    let response;
    try { response = await fetch(`${window.HOSTEL_ASSESS_CONFIG.API_BASE_URL}${path}`, { ...options, headers }); }
    catch { const error = new Error('Unable to reach the server. Please check your connection and try again.'); error.code = 'NETWORK_ERROR'; throw error; }
    const payload = await response.json().catch(() => ({ message: 'The server returned an invalid response.' }));
    if (!response.ok) { const error = new Error(payload.message || 'Request failed.'); Object.assign(error, { status: response.status, code: payload.code, data: payload.data }); throw error; }
    return payload.data;
  }
  return { request, getToken, setToken, clearToken };
})();
