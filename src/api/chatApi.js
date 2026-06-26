const API_BASE = "http://localhost:3000";

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/* ---------- Folders ---------- */
export const getFolders = () => request("/api/folders");
export const createFolder = (name) =>
  request("/api/folders", { method: "POST", body: JSON.stringify({ name }) });
export const updateFolder = (id, name) =>
  request(`/api/folders/${id}`, { method: "PUT", body: JSON.stringify({ name }) });
export const deleteFolder = (id) =>
  request(`/api/folders/${id}`, { method: "DELETE" });

/* ---------- Conversations ---------- */
export const getConversations = (folderId) => {
  const query = folderId !== undefined ? `?folderId=${folderId}` : "";
  return request(`/api/conversations${query}`);
};
export const getConversation = (id) => request(`/api/conversations/${id}`);
export const createConversation = (title, folderId) =>
  request("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ title, folderId }),
  });
export const updateConversation = (id, data) =>
  request(`/api/conversations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteConversation = (id) =>
  request(`/api/conversations/${id}`, { method: "DELETE" });
