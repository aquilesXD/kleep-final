interface FeatureCardProps {
    icon: string
    title: string
    description: string
  }
  
  export function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
      <div className="bg-[#191919] p-1 rounded-lg">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <img
                src={icon || "/placeholder.svg"}
                alt={`${title} icon`}
                width={64}
                height={64}
                className="rounded-xl border border-blue-900/30"
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{title}</h3>
              <p className="text-gray-400 mt-1 text-sm">{description}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  