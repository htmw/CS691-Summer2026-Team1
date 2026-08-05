const API_KEY = "ZTvm-CXzxB|SZZp9";
const BASE_URL = "https://iapo.pythonanywhere.com";

export const getReq = async (endpoint = "/", options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const postReq = async (endpoint = "/", data, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  });

  const responseData = await response.json();

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.response = {
      status: response.status,
      data: responseData,
    };
    throw error;
  }

  return responseData;
};

