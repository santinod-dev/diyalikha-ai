import { auth } from "./firebase";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false,
): Promise<T> {
  const token = await getToken();
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData
      ? (body as FormData)
      : body !== undefined
      ? JSON.stringify(body)
      : undefined,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail?.detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  get:    <T>(path: string)                        => request<T>("GET",    path),
  post:   <T>(path: string, body?: unknown)        => request<T>("POST",   path, body),
  patch:  <T>(path: string, body?: unknown)        => request<T>("PATCH",  path, body),
  delete: <T>(path: string)                        => request<T>("DELETE", path),
  upload: <T>(path: string, formData: FormData)    => request<T>("POST",   path, formData, true),
};
