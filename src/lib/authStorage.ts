import type { AuthResponse } from "../types/TypeChecks";

const AUTH_KEY = "auth";
export const AUTH_CHANGED_EVENT = "edustaff-auth-changed";

export const getStoredAuth = (): AuthResponse | null => {
  const rawAuth = localStorage.getItem(AUTH_KEY);
  if (!rawAuth) return null;

  try {
    const parsedAuth = JSON.parse(rawAuth) as AuthResponse;
    return parsedAuth?.token && parsedAuth?.user ? parsedAuth : null;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
};

export const setStoredAuth = (auth: AuthResponse) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};
