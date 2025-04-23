interface AudienceCardProps {
    title: string
    description: string
  }
  
  export function AudienceCard({ title, description }: AudienceCardProps) {
    return (
      <div className="bg-[#191919] p-1 rounded-lg">
        <div className="p-4 text-center">
          <h3 className="font-bold text-base mb-3 text-white">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
    )
  }
  
  