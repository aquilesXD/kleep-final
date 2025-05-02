import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios"; // Import axios for fetching data
import Sidebar from "../../components/layout/Sidebar";
import { CampaignSidebar } from "../layout/CampainSidebar";
import { Testimonial } from "./Testimonial";
import { FeatureCard } from "./FeatureCard";
import { AudienceCard } from "./AudienceCard";
import { CheckCircle } from "lucide-react";

interface Comment {
  id: number;
  user_id: number;
  user_name: string;
  user_profile_image: string;
  rating: string;
  comment: string;
  created_at: string;
}

interface Reward {
  id: number;
  image: string;
  title: string;
  description: string;
}

interface Audience {
  id: number;
  title: string;
  description: string;
}

interface CampaignData {
  id: number;
  name: string;
  description: string;
  type: string;
  banner_image: string;
  profile_image: string;
  total_budget: string;
  price_per_view: string;
  platforms: string;
  budget_spent: string;
  created_at: string;
  admin_id: number;
  admin_name: string;
  admin_profile_image: string;
  budget_percentage: string;
  joined_users_count: number;
  joined_users_profiles: string[];
  rating: number;
  rewards: Reward[];
  target_audience: Audience[];
}

export default function Campaign() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [message, setMessage] = useState("");
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [targetAudience, setTargetAudience] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const formatUSD = (value: string | number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(typeof value === 'string' ? parseFloat(value) : value);

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        const response = await axios.get(
          `https://contabl.net/kleep/api/campaigns/public/${campaignId}`
        );
        if (response.data.success) {
          setCampaignData(response.data.campaign);
          setComments(response.data.comments);
          setRewards(response.data.rewards);
          setTargetAudience(response.data.target_audience);
          setRequirements(response.data.requirements || []);
        } else {
          setError("Failed to fetch campaign data.");
        }
      } catch (err) {
        setError("An error occurred while fetching data.");
        console.error("Error fetching campaign data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex justify-center items-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] text-red-500 flex justify-center items-center">
        Error: {error}
      </div>
    );
  }

  // Ensure campaignData is not null before accessing its properties
  if (!campaignData) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex justify-center items-center">
        No campaign data available.
      </div>
    );
  }

  // Function to generate star rating display
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    let stars = "";
    for (let i = 0; i < fullStars; i++) stars += "⭐";
    if (hasHalfStar) stars += "⭐";
    for (let i = 0; i < emptyStars; i++) stars += "☆";
    return stars;
  };

  // Simplified star rendering using only full stars up to the rounded rating
  const renderFullStars = (rating: number) => {
    const roundedRating = Math.round(rating);
    let stars = "";
    for (let i = 0; i < 5; i++) {
      if (i < roundedRating) {
        stars += "⭐";
      } else {
        stars += "☆";
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Sidebar />
      <div className="pl-20 lg:pl-24">
        <div className="flex flex-col lg:flex-row">
          <CampaignSidebar />
          <main className="flex-1 p-4 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center">
              {campaignData?.banner_image ? (
                <div className="relative w-full max-h-[300px] overflow-hidden rounded-xl">
                  <img
                  
                    src={campaignData.banner_image ? campaignData.banner_image : undefined} // Only show banner if exists
                    alt={`${campaignData.admin_name} banner`} // Use API data for alt text
                    className="w-full object-cover rounded-xl"
                  />
                </div>
                ) : null}
                {/* Mostrar admin_name y su imagen solo si existe */}
                {campaignData.admin_name && (
                  <div className="mt-8 flex items-center justify-center">
                    <img
                      src={campaignData.profile_image}
                      alt={`${campaignData.admin_name} logo`}
                      width={24}
                      height={24}
                      className="rounded-md mr-2 border border-white/40"
                    />
                    <span className="font-semibold text-lg text-white">
                      {campaignData.admin_name}
                    </span>
                  </div>
                )}

                <div className="max-w-md mx-auto mt-6">
                  <h1 className="text-3xl font-bold leading-tight text-white">
                    {campaignData.name}
                  </h1>
                  <p className="mt-3 text-base text-gray-400">
                    {campaignData.description}
                  </p>
                  {/* Requisitos de la campaña */}
                  {Array.isArray(requirements) && requirements.length > 0 && (
                    <div className="mt-4 bg-[#181818] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-2">Requisitos para participar</h3>
                      <ul className="list-disc list-inside text-gray-300">
                        {requirements.map((req) => (
                          <li key={req.id}>{req.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-6 bg-[#191919] p-6 rounded-lg">
                    <p className="font-semibold text-base text-white">
                      Únase a {campaignData.joined_users_count} personas
                    </p>{" "}
                    {/* Use API data for joined users count */}
                    <div className="flex justify-center -space-x-2 my-3">
                      {campaignData.joined_users_profiles
                        .slice(0, 11) // Take up to 11 profiles
                        .map((profileUrl, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-[#121212] bg-gray-500 overflow-hidden"
                          >
                            <img
                              src={profileUrl} // Use API data for user profiles
                              alt={`User ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                    </div>
                    <p className="text-yellow-400 font-medium">
                        {campaignData.rating.toFixed(2)} stars ({comments.length}) {renderFullStars(campaignData.rating)}
                    </p>{" "}
                    {/* Use API data for rating and comment count */}
                  </div>
                </div>
              </div>

              {/* Testimonials Section */}
              <section className="mt-12">
                <div className="bg-[#191919] p-6 rounded-lg">
                  <h2 className="text-xl font-bold text-center mb-6 text-white">
                    Vea lo que dicen los demás
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Map over fetched comments for testimonials */}
                    {comments.map((comment) => (
                      <Testimonial
                        key={comment.id} // Use comment id as key
                        name={comment.user_name} // Use API data for name
                        avatar={comment.user_profile_image} // Use API data for avatar
                        rating={parseFloat(comment.rating)} // Use API data for rating
                        text={comment.comment} // Use API data for comment text
                        date={`Escrito el ${new Date(comment.created_at).toLocaleDateString()}`} // Use and format API date
                      />
                    ))}
                  </div>
                </div>
              </section>

              <section className="mt-12">
                <h2 className="text-xl font-bold text-center mb-6 text-white">
                  Esto es lo que obtendra
                </h2>
                {(Array.isArray(campaignData?.rewards) && campaignData.rewards.length > 0) || (rewards && rewards.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Map over fetched rewards for features */}
                    {rewards.map((reward) => (
                      <FeatureCard
                        key={reward.id} // Use reward id as key
                        icon={reward.image} // Use API data for icon (image)
                        title={reward.title} // Use API data for title
                        description={reward.description} // Use API data for description
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* About Creator Section */}
              <section className="mt-12">
                <div className="bg-[#191919] p-6 rounded-lg">
                  <div className="max-w-md mx-auto text-center">
                    <h2 className="text-xl font-semibold mb-4 text-white">
                      Saber más sobre mí
                    </h2>
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                      <img
                        src={campaignData.admin_profile_image}
                        alt={`${campaignData.admin_name} profile`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {campaignData.admin_name}
                    </h3>
                    <p className="text-gray-400">
                      @{campaignData.admin_name.replace(/\s+/g, '').toLowerCase()} • Joined in {new Date(campaignData.created_at).getFullYear()}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-12">
                <h2 className="text-xl font-bold text-center mb-6 text-white">
                  A quién va dirigido
                </h2>
                {(Array.isArray(campaignData?.target_audience) && campaignData.target_audience.length > 0) || (targetAudience && targetAudience.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {targetAudience.map((audience) => (
                      <AudienceCard
                        key={audience.id}
                        title={audience.title}
                        description={audience.description}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
              {/* Pricing Section */}
              <section className="mt-12">
                <div className="bg-[#191919] p-6 rounded-lg">
                  <div className="max-w-md mx-auto text-center">
                    <h2 className="text-xl font-semibold mb-4 text-white">
                      Precios
                    </h2>
                    {campaignData.admin_name && campaignData.profile_image ? (
                    <div className="mb-4">
                      <img
                        src={campaignData.profile_image || ""} // Use API data for campaign logo or fallback
                        alt={`${campaignData.name} logo`} // Use API data for alt text
                        width={60}
                        height={60}
                        className="rounded-xl mx-auto"
                      />
                      <h3 className="text-2xl font-bold mt-4 text-white">
                       {campaignData.admin_name}
                      </h3>{" "}
                      {/* Use API data for campaign name */}
                      <p className="text-lg font-semibold mt-2 text-white">
                        {" "}
                        
                      </p>{" "}
                      

                      <div className="mt-6 bg-[#121212] rounded-lg">
                        <ul className="divide-y divide-[#2a2a2a] text-left">
                          {/* Keep hardcoded benefits as they don't map directly to API rewards */}
                          <li className="p-4 flex items-start gap-3 text-gray-400">
                            <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>
                            Tipo de campaña: {campaignData.type} Plataforma {campaignData.platforms}
                            </span>
                          </li>
                          <li className="p-4 flex items-start gap-3 text-gray-400">
                            <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>Presupuesto total {formatUSD(campaignData.total_budget)}</span>
                            </li>
                            <li className="p-4 flex items-start gap-3 text-gray-400">
                            <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>Presupuesto gastado {formatUSD(campaignData.budget_spent)}</span>
                          
                          </li>
                          <li className="p-4 flex items-start gap-3 text-gray-400">
                            <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>
                              Precio por vista: {campaignData.price_per_view}
                            </span>
                          </li>
                          <li className="p-4 flex items-start gap-3 text-gray-400">
                            <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>
                              Porcentaje del presupuesto: {campaignData.budget_percentage}%
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* More Testimonials Section */}
              <section className="mt-12 mb-16">
                <div className="bg-[#191919] p-6 rounded-lg">
                  <h2 className="text-xl font-bold text-center mb-6 text-white">
                    Reseñas
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Map over fetched comments for reviews */}
                    {comments.map((comment) => (
                      <Testimonial
                        key={comment.id} // Use comment id as key
                        name={comment.user_name} // Use API data for name
                        avatar={comment.user_profile_image} // Use API data for avatar
                        rating={parseFloat(comment.rating)} // Use API data for rating
                        text={comment.comment} // Use API data for comment text
                        date={`Escrito el ${new Date(comment.created_at).toLocaleDateString()}`} // Use and format API date
                      />
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}