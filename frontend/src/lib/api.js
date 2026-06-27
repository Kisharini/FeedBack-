const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const AUTH_STORAGE_KEY = "feedback_auth";

const buildHeaders = (token, extraHeaders = {}) => {
  const headers = { ...extraHeaders };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => ({
    success: false,
    message: "Unexpected server response",
  }));

  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || "Request failed");
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const apiRequest = async (path, options = {}) => {
  let { token, headers, body, ...rest } = options;

  if (!token) {
    const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);

    if (rawAuth) {
      try {
        if (typeof rawAuth === "object") {
          token = rawAuth.token;
        } else {
          const authData = JSON.parse(rawAuth);
          token = authData?.token;
        }
      } catch (e) {
        console.error("Failed to extract token securely:", e);
        
        const match = rawAuth.match(/"token"\s*:\s*"([^"]+)"/);
        if (match) token = match[1];
      }
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(token, headers),
    body,
  });

  return parseResponse(response);
};

export const jsonRequest = (path, options = {}) => {
  const { token, body, headers, ...rest } = options;
  
  return apiRequest(path, {
    ...rest,
    token,
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
};