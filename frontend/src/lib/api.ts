import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // send HTTP-only cookies
  headers: { "Content-Type": "application/json" },
});

// Add request interceptor to log cookie sending
api.interceptors.request.use(
  (config) => {
    // #region agent log
    if (typeof window !== "undefined") {
      // Check if cookies are available for the API domain
      const apiUrl = new URL(config.baseURL || process.env.NEXT_PUBLIC_API_URL || '');
      const cookiesAvailable = document.cookie.split(';').some(c => c.trim().startsWith('access_token='));
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:request',message:'API request',data:{url:config.url,withCredentials:config.withCredentials,apiDomain:apiUrl.hostname,currentDomain:window.location.hostname,cookiesInDocument:cookiesAvailable},timestamp:Date.now(),runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    }
    // #endregion
    return config;
  },
  (error) => Promise.reject(error)
);

// Redirect to login on 401 (expired / missing token).
// Exclude auth endpoints that naturally return 401.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith("/auth/")) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
