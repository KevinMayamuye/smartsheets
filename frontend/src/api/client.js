import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "smartsheets-production.up.railway.app",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body.success === "boolean") {
      if (!body.success) {
        return Promise.reject({
          response: { data: body, status: response.status },
        });
      }
      return { ...response, data: body.data, message: body.message };
    }
    return response;
  },
  (err) => Promise.reject(err)
);

export default api;
