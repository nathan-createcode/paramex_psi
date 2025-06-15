const FeatureCard = ({ icon, title, description, className = "" }) => {
  return (
    <div className={`p-8 border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all ${className}`}>
      <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">{icon}</div>
      <h2 className="text-xl font-bold mb-3 text-gray-900">{title}</h2>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

export default FeatureCard
