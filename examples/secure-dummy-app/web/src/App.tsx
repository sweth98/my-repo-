import { useCallback, useEffect, useState } from "react";
import { api, type Item } from "./api";

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [user, setUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { items } = await api.listItems();
      setItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load items");
    }
  }, []);

  useEffect(() => {
    (async () => {
      // A 401 here is the normal signed-out state, not an error worth showing.
      try {
        setUser((await api.me()).user);
      } catch {
        setUser(null);
      }
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  if (loading) return <main className="app">Loading…</main>;

  return (
    <main className="app">
      <header>
        <h1>Harvest Hub (demo)</h1>
        <p className="sub">
          A deliberately small app for exercising the Docker setup.
        </p>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section>
        <h2>Inventory</h2>
        <ul className="items">
          {items.map((item) => (
            // React escapes interpolated text, so a name like
            // <img onerror=...> renders as literal characters rather than
            // executing. Never replace this with dangerouslySetInnerHTML.
            <li key={item.id}>
              <span>{item.name}</span>
              <span className="stock">{item.stock}</span>
            </li>
          ))}
        </ul>
        {items.length === 0 && <p className="sub">No items yet.</p>}
      </section>

      {user ? (
        <AddItem
          user={user}
          onAdded={refresh}
          onSignedOut={() => setUser(null)}
          onError={setError}
        />
      ) : (
        <LoginForm onSignedIn={setUser} onError={setError} />
      )}

      <footer className="sub">
        Reading inventory is public. Adding an item requires a session, enforced
        by the API — not by hiding this form.
      </footer>
    </main>
  );
}

function LoginForm({
  onSignedIn,
  onError,
}: {
  onSignedIn: (user: string) => void;
  onError: (message: string) => void;
}) {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    onError("");
    try {
      onSignedIn((await api.login(username, password)).user);
    } catch (err) {
      onError(err instanceof Error ? err.message : "login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Sign in</h2>
      <form onSubmit={submit} className="row">
        <input
          aria-label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          maxLength={64}
          required
        />
        <input
          aria-label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          maxLength={200}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? "…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}

function AddItem({
  user,
  onAdded,
  onSignedOut,
  onError,
}: {
  user: string;
  onAdded: () => void;
  onSignedOut: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [stock, setStock] = useState("0");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    onError("");
    try {
      // Client-side coercion is for usability. The API re-validates every
      // field, because anything sent from a browser can be forged.
      await api.addItem(name, Number(stock));
      setName("");
      setStock("0");
      onAdded();
    } catch (err) {
      onError(err instanceof Error ? err.message : "could not add item");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>
        Add item <span className="sub">— signed in as {user}</span>
      </h2>
      <form onSubmit={submit} className="row">
        <input
          aria-label="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          maxLength={80}
          required
        />
        <input
          aria-label="Stock"
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          min={0}
          max={100000}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? "…" : "Add"}
        </button>
      </form>
      <button
        className="link"
        onClick={async () => {
          await api.logout();
          onSignedOut();
        }}
      >
        Sign out
      </button>
    </section>
  );
}
