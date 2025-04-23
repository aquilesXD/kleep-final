import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import { CampaignSidebar } from "../layout/CampainSidebar";
import { Testimonial } from "./Testimonial";
import { FeatureCard } from "./FeatureCard";
import { AudienceCard } from "./AudienceCard";
import { CheckCircle } from "lucide-react";

// Token de autenticación
const API_TOKEN = "LdiVnsTkivJjcoEs16w5D6osE39IRbu1hJ75WjVVe2vf5JGyJFvjE0u4dojto4lq";

// Interfaz para los datos de la campaña
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
}

interface Comment {
  id: number;
  comment: string;
  rating: string;
  created_at: string;
  user_id: number;
  user_name: string;
  user_profile_image: string;
}

interface Reward {
  id: number;
  title: string;
  description: string;
  image: string;
}

interface TargetAudience {
  id: number;
  title: string;
  description: string;
}

interface CampaignResponse {
  campaign: CampaignData;
  comments: Comment[];
  rewards: Reward[];
  target_audience: TargetAudience[];
  is_joined: boolean;
}

export default function Campaign() {
  const { campaignId = "1" } = useParams<{ campaignId: string }>();
  const [campaignData, setCampaignData] = useState<CampaignResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}`, {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error al cargar los datos de la campaña (${response.status})`);
        }

        const data = await response.json();
        setCampaignData(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error('Error al cargar los datos de la campaña:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [campaignId]);

  // Formatear el precio para mostrar
  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  // Mostrar mensaje de carga mientras se obtienen los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
        <p className="text-white ml-4">Cargando campaña...</p>
      </div>
    );
  }

  // Mostrar mensaje de error si algo falla
  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center">
        <p className="text-red-500 text-xl">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md">
          Reintentar
        </button>
      </div>
    );
  }

  // Renderizar la campaña con los datos obtenidos
  return (
    <div className="min-h-screen bg-[#121212]">
      <Sidebar />
      <div className="pl-20 lg:pl-24">
        <div className="flex flex-col lg:flex-row">
          <CampaignSidebar />
          <main className="flex-1 p-4 lg:p-8">
            {campaignData && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="relative w-full max-h-[300px] overflow-hidden rounded-xl">
                    <img
                      src={campaignData.campaign.banner_image}
                      alt={`${campaignData.campaign.name} banner`}
                      className="w-full object-cover rounded-xl"
                    />
                  </div>

                  <div className="mt-8 flex items-center justify-center">
                    <img
                      src={campaignData.campaign.profile_image}
                      alt={`${campaignData.campaign.name} logo`}
                      width={24}
                      height={24}
                      className="rounded-md mr-2 border border-white/40"
                    />
                    <span className="font-semibold text-lg text-white">{campaignData.campaign.name}</span>
                  </div>

                  <div className="max-w-md mx-auto mt-6">
                    <h1 className="text-3xl font-bold leading-tight text-white">
                      {campaignData.campaign.name}
                    </h1>
                    <p className="mt-3 text-base text-gray-400">
                      {campaignData.campaign.description}
                    </p>
                    <button className="w-full mt-4 text-base py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md hidden">
                      Unete a
                    </button>

                    <div className="mt-6 bg-[#191919] p-6 rounded-lg">
                      <p className="font-semibold text-base text-white">
                        Únase a {campaignData.campaign.joined_users_count} personas
                      </p>
                      <div className="flex justify-center -space-x-2 my-3">
                        {campaignData.campaign.joined_users_profiles.map((profile, index) => (
                          <div
                            key={index}
                            className="w-8 h-8 rounded-full border-2 border-[#121212] bg-gray-500 overflow-hidden"
                          >
                            <img
                              src={profile}
                              alt={`Usuario ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-yellow-400 font-medium">
                        {campaignData.campaign.rating.toFixed(1)} estrellas ({campaignData.comments.length}) 
                        {Array(Math.round(campaignData.campaign.rating)).fill('⭐').join('')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Testimonials Section */}
                <section className="mt-12">
                  <div className="bg-[#191919] p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-center mb-6 text-white">Vea lo que dicen los demás</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaignData.comments.map(comment => (
                        <Testimonial
                          key={comment.id}
                          name={comment.user_name}
                          avatar={comment.user_profile_image}
                          rating={parseFloat(comment.rating)}
                          text={comment.comment}
                          date={`Escrito el ${new Date(comment.created_at).toLocaleDateString()}`}
                        />
                      ))}
                    </div>
                  </div>
                </section>

                {/* Features/Rewards Section */}
                <section className="mt-12">
                  <h2 className="text-xl font-bold text-center mb-6 text-white">Recompensas que obtendrás</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaignData.rewards.map(reward => (
                      <FeatureCard
                        key={reward.id}
                        icon={reward.image}
                        title={reward.title}
                        description={reward.description}
                      />
                    ))}
                  </div>
                </section>

                {/* About Creator Section */}
                <section className="mt-12">
                  <div className="bg-[#191919] p-6 rounded-lg">
                    <div className="max-w-md mx-auto text-center">
                      <h2 className="text-xl font-semibold mb-4 text-white">Acerca del creador</h2>
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                        <img
                          src={campaignData.campaign.admin_profile_image}
                          alt={`${campaignData.campaign.admin_name} profile`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{campaignData.campaign.admin_name}</h3>
                      <p className="text-gray-400">Administrador de la campaña</p>
                    </div>
                  </div>
                </section>

                {/* Target Audience Section */}
                <section className="mt-12">
                  <h2 className="text-xl font-bold text-center mb-6 text-white">A quien va dirigido</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaignData.target_audience.map(audience => (
                      <AudienceCard
                        key={audience.id}
                        title={audience.title}
                        description={audience.description}
                      />
                    ))}
                  </div>
                </section>

                {/* Pricing Section */}
                <section className="mt-12">
                  <div className="bg-[#191919] p-6 rounded-lg">
                    <div className="max-w-md mx-auto text-center">
                      <h2 className="text-xl font-semibold mb-4 text-white">Detalles de la Campaña</h2>
                      <div className="mb-4">
                        <img
                          src={campaignData.campaign.profile_image}
                          alt={campaignData.campaign.name}
                          width={60}
                          height={60}
                          className="rounded-xl mx-auto"
                        />
                        <h3 className="text-2xl font-bold mt-4 text-white">Únase a {campaignData.campaign.name}</h3>
                        <p className="text-lg font-semibold mt-2 text-white">
                          {formatCurrency(campaignData.campaign.price_per_view)} por cada vista
                        </p>

                        <div className="mt-6 bg-[#121212] rounded-lg">
                          <ul className="divide-y divide-[#2a2a2a] text-left">
                            <li className="p-4 flex items-start gap-3 text-gray-400">
                              <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>Presupuesto total: {formatCurrency(campaignData.campaign.total_budget)}</span>
                            </li>
                            <li className="p-4 flex items-start gap-3 text-gray-400">
                              <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>Gastado hasta ahora: {formatCurrency(campaignData.campaign.budget_spent)}</span>
                            </li>
                            <li className="p-4 flex items-start gap-3 text-gray-400">
                              <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>Plataformas: {campaignData.campaign.platforms}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
