import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import { CampaignSidebar } from "../layout/CampainSidebar";
import { Testimonial } from "./Testimonial";
import { FeatureCard } from "./FeatureCard";
import { AudienceCard } from "./AudienceCard";
import { CheckCircle } from "lucide-react";

// Interfaz para los datos de la campaña pública
interface PublicCampaign {
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
  admin_name: string;
  admin_profile_image: string;
  budget_percentage: string;
  is_joined: boolean;
}

interface PublicCampaignResponse {
  success: boolean;
  total: number;
  campaigns: PublicCampaign[];
}

export default function Campaign() {
  const { campaignId = "1" } = useParams<{ campaignId: string }>();
  const [campaignData, setCampaignData] = useState<PublicCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Cargar datos de la campaña pública
  useEffect(() => {
    const fetchPublicCampaignData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('https://contabl.net/kleep/api/campaigns/public/');

        if (!response.ok) {
          throw new Error(`Error al cargar los datos de la campaña (${response.status})`);
        }

        const data: PublicCampaignResponse = await response.json();
        
        if (!data.success) {
          throw new Error('Error al obtener los datos de la campaña');
        }

        const campaign = data.campaigns.find((c: PublicCampaign) => c.id === parseInt(campaignId));
        
        if (!campaign) {
          throw new Error('Campaña no encontrada');
        }

        setCampaignData(campaign);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicCampaignData();
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
                      src={campaignData.banner_image}
                      alt=""
                      className="w-full object-cover rounded-xl"
                    />
                  </div>

                  <div className="mt-8 flex items-center justify-center">
                    <img
                      src={campaignData.profile_image}
                      alt={`${campaignData.name} logo`}
                      width={24}
                      height={24}
                      className="rounded-md mr-2 border border-white/40"
                    />
                    <span className="font-semibold text-lg text-white">{campaignData.name}</span>
                  </div>

                  <div className="max-w-md mx-auto mt-6">
                    <h1 className="text-3xl font-bold leading-tight text-white">
                      {campaignData.name}
                    </h1>
                    <p className="mt-3 text-base text-gray-400">
                      {campaignData.description}
                    </p>

                    <div className="mt-6 bg-[#191919] p-6 rounded-lg">
                      <p className="font-semibold text-base text-white">
                        Únase a 726 personas
                      </p>
                      <div className="flex justify-center -space-x-2 my-3">
                        {[1, 2, 3, 4, 5].map((_, index) => (
                          <div
                            key={index}
                            className="w-8 h-8 rounded-full border-2 border-[#121212] bg-gray-500 overflow-hidden"
                          >
                            <img
                              src={`https://randomuser.me/api/portraits/men/${index + 1}.jpg`}
                              alt={`Usuario ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-yellow-400 font-medium">
                        4.9 estrellas (1) ⭐⭐⭐⭐⭐
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección de Precios */}
                <section className="mt-12">
                  <div className="bg-[#191919] p-6 rounded-lg">
                    <div className="max-w-md mx-auto text-center">
                      <h2 className="text-xl font-semibold mb-4 text-white">Detalles de la Campaña</h2>
                      <div className="mb-4">
                        <img
                          src={campaignData.profile_image}
                          alt={campaignData.name}
                          width={60}
                          height={60}
                          className="rounded-xl mx-auto"
                        />
                        <h3 className="text-2xl font-bold mt-4 text-white">
                          {campaignData.name}
                        </h3>
                        <p className="text-lg font-semibold mt-2 text-white">
                          {formatCurrency(campaignData.price_per_view)} por cada vista
                        </p>

                        <div className="mt-6 bg-[#121212] rounded-lg">
                          <ul className="divide-y divide-[#2a2a2a] text-left">
                            <li className="p-4 flex items-start gap-3 text-gray-400">
                              <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>Presupuesto total: {formatCurrency(campaignData.total_budget)}</span>
                            </li>
                            <li className="p-4 flex items-start gap-3 text-gray-400">
                              <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>Gastado hasta ahora: {formatCurrency(campaignData.budget_spent)}</span>
                            </li>
                            <li className="p-4 flex items-start gap-3 text-gray-400">
                              <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>Plataformas: {campaignData.platforms}</span>
                            </li>
                            <li className="p-4 flex items-start gap-3 text-gray-400">
                              <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>Porcentaje del presupuesto: {campaignData.budget_percentage}%</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Sección Acerca del Creador */}
                <section className="mt-12">
                  <div className="bg-[#191919] p-6 rounded-lg">
                    <div className="max-w-md mx-auto text-center">
                      <h2 className="text-xl font-semibold mb-4 text-white">Acerca del Creador</h2>
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                        <img
                          src={campaignData.admin_profile_image}
                          alt={`Perfil de ${campaignData.admin_name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{campaignData.admin_name}</h3>
                      <p className="text-gray-400">Administrador de la campaña</p>
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
