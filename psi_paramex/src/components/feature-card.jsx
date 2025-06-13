const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="p-8 rounded-[30px] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.05)] mb-10">
      <div className="h-14 w-14 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-6">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-[#1a1a1a]">{title}</h3>
      <p className="text-[#6b6b6b] leading-relaxed">{description}</p>
    </div>
  )
}

export default FeatureCard
