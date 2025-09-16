import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Memorio — Frontend</h1>
      <p><a href="/login">Login</a> · <a href="/dashboard">Dashboard</a> · <a href="/profile">Profile</a></p>
      <p>API URL: {import.meta.env.VITE_API_URL}</p>
    </div>
  );
}
