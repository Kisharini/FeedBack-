const AUTH_STORAGE_KEY = "feedback_auth";

export const getStoredAuth = () => {
  try {
    const value = localStorage.getItem(AUTH_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const saveAuth = (authData) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
<<<<<<< HEAD
=======
  if (authData?.token){
    localStorage.setItem("token", authData.token)
  }
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
  window.dispatchEvent(new Event("authchange"));
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event("authchange"));
};

export const getToken = () => getStoredAuth()?.token || null;

export const getCurrentUserFromStorage = () => getStoredAuth()?.user || null;
