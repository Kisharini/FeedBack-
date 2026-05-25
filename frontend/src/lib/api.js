const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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
  const { token, headers, body, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(token, headers),
    body,
  });

  return parseResponse(response);
};

export const jsonRequest = (path, { token, body, ...rest } = {}) =>
  apiRequest(path, {
    ...rest,
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
