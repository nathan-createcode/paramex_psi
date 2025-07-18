"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabase";
import LogoFrame from "../components/ui/logo-frame";
import gambarLogin from "../assets/gambar_login.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white">
      {/* Tombol kecil gradasi biru-ungu di pojok kiri atas */}
      <button
  onClick={() => navigate("/")}
  className="absolute top-4 left-4 px-4 py-1.5 text-sm text-white font-medium rounded-md bg-black hover:bg-gray-800 transition"
>
  ← Landing Page
</button>


      <div className="flex flex-col lg:flex-row w-full max-w-6xl p-4 lg:p-0">
        {/* Form Login */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-16 py-12">
          <div className="max-w-md w-full mx-auto">
            <h1 className="text-3xl font-bold mb-1 text-gray-800">
              Login to your account
            </h1>
            <p className="text-gray-600 mb-8 text-sm">
              Enter your email and password to login
            </p>

            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="block text-gray-700 mb-2 text-sm"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Your Email"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block text-gray-700 mb-2 text-sm"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6 text-sm">
                <Link to="#" className="text-gray-500 hover:text-gray-700">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-black text-white hover:bg-gray-900 transition"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Gambar Login */}
        <img
          src={gambarLogin}
          alt="Login Illustration"
          className="w-[40%] h-auto object-contain"
        />
      </div>
    </div>
  );
};

export default LoginPage;
