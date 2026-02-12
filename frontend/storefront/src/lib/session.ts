const SESSION_KEY = 'ecom_session_id';

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
