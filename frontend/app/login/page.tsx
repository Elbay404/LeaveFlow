"use client"; 

import { log } from "console";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  

const handleSubmit = async (e: { preventDefault: () => void; }) => {
  e.preventDefault();//prevent reload

const response = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    credentials: "include",

    headers: {
        "Content-Type": "application/json",
    },

    body: JSON.stringify({
        email,
        password,
    }),
});

const data = await response.text();

console.log("Status:", response.status);
console.log("Response:", data);

};

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-gray-900 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold ">
          Leave Management
        </h1>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border p-2"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border p-2"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-black p-2 text-white"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}

