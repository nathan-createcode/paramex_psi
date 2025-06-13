// Logo Frame Component
// Komponen ini menyediakan frame untuk logo aplikasi
// Anda dapat menyesuaikan ukuran frame dengan mengubah nilai h-10 dan w-10
// h-10 = tinggi 2.5rem (40px), w-10 = lebar 2.5rem (40px)

const LogoFrame = ({ src, alt = "Logo aplikasi", className = "" }) => {
  return (
    <div
      className={`relative h-10 w-10 rounded-full bg-[#e7e7e7] flex items-center justify-center overflow-hidden ${className}`}
    >
      {src ? (
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="object-contain w-30/31 h-30/31" // Ukuran gambar 75% dari frame untuk memberikan padding
        />
      ) : (
        // Placeholder kosong jika tidak ada gambar
        <div className="w-3/4 h-3/4"></div>
      )}
    </div>
  )
}

export default LogoFrame
