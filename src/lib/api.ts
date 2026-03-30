import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const accountId = localStorage.getItem("account_id");
  if (accountId) {
    config.headers["x-account-id"] = accountId;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("account_id");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;
