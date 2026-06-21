<<<<<<< HEAD
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
=======
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const AUTH_STORAGE_KEY = "feedback_auth";
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f

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
<<<<<<< HEAD
  const { token, headers, body, ...rest } = options;
=======
  let { token, headers, body, ...rest } = options;

  if (!token) {
    const rawAuth = localStorage.getItem("feedback_auth");

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
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(token, headers),
    body,
  });

  return parseResponse(response);
};

<<<<<<< HEAD
export const jsonRequest = (path, { token, body, ...rest } = {}) =>
  apiRequest(path, {
=======
export const jsonRequest = (path, options = {}) => {
  const { token, body, headers, ...rest } = options;
  
   return apiRequest(path, {
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
    ...rest,
    token,
    headers: {
      "Content-Type": "application/json",
    },
<<<<<<< HEAD
    body: JSON.stringify(body),
  });
=======
    body: body? JSON.stringify(body) : undefined,
   });
};
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
