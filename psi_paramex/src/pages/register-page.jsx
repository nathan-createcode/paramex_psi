"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabase";
import gambarRegister from "../assets/gambar_register.png";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const convertToIntlPhone = (number) => {
    const trimmed = number.trim();
    if (trimmed.startsWith("+")) return trimmed;
    if (trimmed.startsWith("0")) return "+62" + trimmed.slice(1);
    return "+62" + trimmed;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!validateEmail(email)) {
      setError("Format email tidak valid. Pastikan email Anda benar.");
      setLoading(false);
      return;
    }

    const intlPhone = convertToIntlPhone(phone);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            phone: intlPhone,
            display_name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (authData?.user) {
        const { error: insertError } = await supabase
          .from("users")
          .insert([
            {
              user_id: authData.user.id,
              name: name.trim(),
              email: email.trim(),
              phone_number: intlPhone,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.error("Error inserting user data:", insertError);
        }
      }

      setSuccessMessage(
        "Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi. Setelah konfirmasi, Anda dapat login menggunakan email dan password."
      );

      setName("");
      setEmail("");
      setPhone("");
      setPassword("");

      setTimeout(() => {
        window.location.href = "/login";
      }, 4000);
    } catch (error) {
      console.error("Registration error:", error);

      if (error.message.includes("Database error")) {
        setError("Terjadi kesalahan pada database. Silakan coba lagi nanti.");
      } else if (error.message.includes("User already registered")) {
        setError("Email ini sudah terdaftar. Silakan login atau gunakan email lain.");
      } else if (error.message.includes("Password should be at least")) {
        setError("Password terlalu pendek. Gunakan minimum 6 characters.");
      } else if (error.message.includes("Invalid email")) {
        setError("Format email tidak valid.");
      } else {
        setError(`Terjadi kesalahan: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row relative">
      {/* Tombol kembali ke landing */}
      <button
  onClick={() => navigate("/")}
  className="absolute top-4 left-4 px-4 py-1.5 text-sm text-white font-medium rounded-md bg-black hover:bg-gray-800 transition"
>
  ← Landing Page
</button>

      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-white">
        <img
          src={gambarRegister}
          alt="Register Illustration"
          className="w-[70%] h-auto object-contain"
        />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 md:px-12 lg:px-24 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Create new account</h1>
          <p className="text-gray-600 mb-6 text-sm">Sign up to start managing your project</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 mb-1">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Your Name"
                className="w-full px-5 py-2 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email"
                className={`w-full px-5 py-2 rounded-2xl border ${
                  email && !validateEmail(email)
                    ? "border-red-400"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-gray-200`}
                required
              />
              {email && !validateEmail(email) && (
                <p className="mt-1 text-sm text-red-600">Format email tidak valid</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="phone" className="block text-gray-700 mb-1">Phone Number</label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Example: 081234567890"
                className="w-full px-5 py-2 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Your Password"
                className="w-full px-5 py-2 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-3 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-2">
              Have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
