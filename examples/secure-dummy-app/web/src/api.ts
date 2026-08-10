// All requests are same-origin: nginx serves this bundle and proxies /api to
// the API container, so the browser only ever sees one origin.
//
// That is a deliberate security choice, not a convenience. It means:
//   - no CORS configuration to get wrong (the usual way an API ends up
//     readable by any website),
//   - SameSite=Strict cookies work, which is the CSRF defence,
//   - the API is never published on a host port at all.

export type Item = { id: number; name: string; stock: number };

const JSON_HEADERS = { "Content-Type": "application/json" };

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    // Send the session cookie, but only to this origin.
    credentials: "same-origin",
    ...init,
  });

  if (!res.ok) {
    // Read the server's message when it is JSON, but never assume it is.
    let message = `request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.error === "string") message = body.error;
    } catch {
      /* non-JSON error response */
    }
    throw new ApiError(message, res.status);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  listItems: () => request<{ items: Item[] }>("/api/items"),

  me: () => request<{ user: string }>("/api/me"),

  login: (username: string, password: string) =>
    request<{ user: string }>("/api/login", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<void>("/api/logout", { method: "POST" }),

  addItem: (name: string, stock: number) =>
    request<{ item: Item }>("/api/items", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name, stock }),
    }),
};

export { ApiError };
