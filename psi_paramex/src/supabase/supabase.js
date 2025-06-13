import { createClient } from "@supabase/supabase-js"

// Mengambil kredensial dari variabel lingkungan
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Membuat client Supabase dengan opsi tambahan
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Fungsi untuk memeriksa koneksi Supabase
export const testSupabaseConnection = async () => {
  try {
    // Coba operasi sederhana untuk memeriksa koneksi
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Supabase connection error:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error("Supabase connection test failed:", err)
    return { success: false, error: err }
  }
}
