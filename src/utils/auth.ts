import { invoke } from "@tauri-apps/api/core";

const AUTH_STORAGE_KEY = "auth_credentials";

export interface AuthCredentials {
  email: string;
  password: string;
}

export const saveCredentials = (credentials: AuthCredentials): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(credentials));
};

export const getStoredCredentials = (): AuthCredentials | null => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const clearStoredCredentials = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    return await invoke("check_auth");
  } catch {
    return false;
  }
};

export const loginUser = async (email: string, password: string, remember: boolean): Promise<boolean> => {
  try {
    const success = await invoke("login", { email, password, remember });
    if (success && remember) {
      saveCredentials({ email, password });
    }
    return success as boolean;
  } catch {
    return false;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await invoke("logout");
    clearStoredCredentials();
  } catch (error) {
    console.error("Logout error:", error);
  }
};

export const getUserId = async (): Promise<string | null> => {
  try {
    const userId = await invoke("get_user_id");
    return userId as string | null;
  } catch (error) {
    console.error("Get user ID error:", error);
    return null;
  }
};