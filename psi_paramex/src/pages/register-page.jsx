"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/supabase";
import gambarRegister from "../assets/gambar_register.png";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null); // Untuk debugging

  // Fungsi untuk validasi email
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setDebugInfo(null);

    // Validasi email terlebih dahulu
    if (!validateEmail(email)) {
      setError("Format email tidak valid. Pastikan email Anda benar.");
      setLoading(false);
      return;
    }

    try {
      // Pendekatan 1: Coba daftar dengan metode normal
      console.log("Attempting to register with:", {
        email: email.trim(),
        password,
        name,
      });

      // Mendaftarkan user dengan Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name || "", // Pastikan nilai kosong jika tidak ada nama
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      // Simpan info debug
      setDebugInfo({
        signUpResponse: {
          data,
          error: signUpError ? signUpError.message : null,
        },
      });

      if (signUpError) {
        console.error("Signup error details:", signUpError);

        // Pendekatan 2: Jika pendaftaran normal gagal, coba pendekatan alternatif
        if (signUpError.message.includes("Database error")) {
          // Coba daftar tanpa metadata dulu
          const { data: altData, error: altError } = await supabase.auth.signUp(
            {
              email: email.trim(),
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/dashboard`,
              },
            }
          );

          setDebugInfo((prev) => ({
            ...prev,
            alternativeSignUp: {
              data: altData,
              error: altError ? altError.message : null,
            },
          }));

          if (altError) {
            throw new Error(`Pendaftaran gagal: ${altError.message}`);
          }

          // Jika berhasil, coba tambahkan data user secara manual
          if (altData?.user?.id) {
            const { error: insertError } = await supabase.from("users").insert([
              {
                user_id: altData.user.id,
                email: email.trim(),
                name: name || "",
              },
            ]);

            setDebugInfo((prev) => ({
              ...prev,
              manualInsert: { error: insertError ? insertError.message : null },
            }));

            if (insertError) {
              console.error("Manual insert error:", insertError);
              // Tetap lanjutkan karena auth sudah berhasil
            }
          }

          // Anggap pendaftaran berhasil jika auth berhasil
          setSuccessMessage(
            "Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi."
          );

          // Tunggu sebentar sebelum redirect
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);

          return;
        } else {
          throw signUpError;
        }
      }

      // Jika registrasi berhasil
      setSuccessMessage(
        "Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi."
      );

      // Tunggu sebentar sebelum redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (error) {
      console.error("Full error object:", error);

      // Pesan error yang lebih user-friendly
      if (error.message.includes("Database error")) {
        setError(
          "Terjadi kesalahan pada database. Silakan coba lagi nanti atau hubungi administrator."
        );
      } else if (error.message.includes("User already registered")) {
        setError(
          "Email ini sudah terdaftar. Silakan login atau gunakan email lain."
        );
      } else if (error.message.includes("Password should be at least")) {
        setError("Password terlalu pendek. Gunakan minimal 6 karakter.");
      } else {
        console.error("Error tidak dikenali:", error);
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Bagian Ilustrasi */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-white">
        {/* Gambar Register */}
        <img
          src={gambarRegister}
          alt="Register Illustration"
          className="w-[70%] h-auto object-contain"
        />
      </div>

      {/* Bagian Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 md:px-12 lg:px-24 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-3 text-gray-800">
            Create new account
          </h1>
          <p className="text-gray-600 mb-8 text-sm">
            Sign up to start managing your project
          </p>

          {/* Tampilkan Error */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Tampilkan Pesan Sukses */}
          {successMessage && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {/* Input Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-gray-700 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Your name"
                className="w-full px-5 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                required
              />
            </div>

            {/* Input Email */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email"
                className={`w-full px-5 py-3 rounded-2xl border ${
                  email && !validateEmail(email)
                    ? "border-red-400"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-gray-200`}
                required
              />
              {email && !validateEmail(email) && (
                <p className="mt-1 text-sm text-red-600">
                  Format email tidak valid
                </p>
              )}
            </div>

            {/* Input Password */}
            <div className="mb-8">
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Your Password"
                className="w-full px-5 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                required
                minLength={6}
              />
            </div>

            {/* Tombol Register */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-3 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 transition"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600">
            Have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
