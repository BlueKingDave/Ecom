const SESSION_KEY = 'ecom_session_id';
export function getSessionId() {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
}
export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}
function generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
