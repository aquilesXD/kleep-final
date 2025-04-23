interface TestimonialProps {
    name: string
    avatar: string
    rating: number
    text: string
    date: string
  }
  
  export function Testimonial({ name, avatar, rating, text, date }: TestimonialProps) {
    return (
      <div className="bg-[#121212] rounded-lg h-full">
        <div className="p-3 border-b border-[#2a2a2a]">
          <div className="flex items-center">
            <div className="h-12 w-12 mr-3 rounded-full overflow-hidden">
              <img src={avatar || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-medium text-white">{name}</h3>
              <div className="text-yellow-400 text-xs">{"⭐".repeat(rating)}</div>
            </div>
          </div>
        </div>
        <div className="p-4 relative h-[calc(100%-60px)]">
          <p className="text-base text-white">{text}</p>
          <p className="text-xs text-gray-400 absolute bottom-4 left-4">{date}</p>
        </div>
      </div>
    )
  }
  