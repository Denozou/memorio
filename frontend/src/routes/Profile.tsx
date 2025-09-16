import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Me = { id: string; email: string; createdAt: string };

export default function Profile() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Me>("/users/me")
      .then(r => setMe(r.data))
      .catch(err => setError(err?.response?.data?.error ?? "Failed to load profile"));
  }, []);

  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!me) return <p>Loading...</p>;

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Profile</h1>
      <p><b>ID:</b> {me.id}</p>
      <p><b>Email:</b> {me.email}</p>
      <p><b>Created:</b> {new Date(me.createdAt).toLocaleString()}</p>
      <button onClick={() => { localStorage.clear(); location.href = "/login"; }}>
        Log out
      </button>
    </div>
  );
}