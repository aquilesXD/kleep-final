"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/layout/Sidebar";
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { RewardCard } from "./RewardCard";

// Definir la interfaz para las campañas
interface Campaign {
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

// Mapear las campañas al formato de recompensas
const mapCampaignToReward = (campaign: Campaign) => {
  return {
    id: campaign.id,
    avatar: campaign.profile_image,
    creator: campaign.admin_name,
    title: campaign.name,
    paidAmount: campaign.budget_spent,
    totalAmount: campaign.total_budget,
    percentage: parseInt(campaign.budget_percentage),
    type: campaign.type,
    platform: campaign.platforms,
    rate: campaign.price_per_view,
    isJoined: campaign.is_joined
  };
}

// Token de autenticación
const API_TOKEN = "LdiVnsTkivJjcoEs16w5D6osE39IRbu1hJ75WjVVe2vf5JGyJFvjE0u4dojto4lq";

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [rewards, setRewards] = useState<any[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const userEmail = localStorage.getItem("userEmail");
    setIsAuthenticated(Boolean(authStatus && userEmail));
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        
        // Intentar con el token en el header primero (Bearer token)
        let response = await fetch('https://contabl.net/kleep/api/campaigns', {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        // Si falla con 401, intentar con un formato diferente del token de autorización
        if (response.status === 401) {
          console.log("Intentando con formato de token diferente...");
          
          response = await fetch('https://contabl.net/kleep/api/campaigns', {
            headers: {
              'Authorization': API_TOKEN,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
        }
        
        // Si sigue fallando, intentar con el token como parámetro de consulta
        if (response.status === 401) {
          console.log("Intentando autenticación alternativa con token como parámetro de consulta...");
          
          response = await fetch(`https://contabl.net/kleep/api/campaigns?api_token=${API_TOKEN}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          // Si sigue fallando, intentar con 'token' en lugar de 'api_token'
          if (response.status === 401) {
            console.log("Intentando autenticación con 'token' como parámetro...");
            
            response = await fetch(`https://contabl.net/kleep/api/campaigns?token=${API_TOKEN}`, {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
          }
        }
        
        if (!response.ok) {
          const statusCode = response.status;
          throw new Error(`Error al cargar las campañas (${statusCode})`);
        }
        
        const data = await response.json();
        
        if (!data.campaigns) {
          throw new Error('Formato de respuesta inválido: no se encontraron campañas');
        }
        
        // Guardar las campañas obtenidas
        const allCampaigns = data.campaigns;
        setCampaigns(allCampaigns);
        setTotalResults(allCampaigns.length);
        
        // Mapear las campañas al formato de recompensas inicialmente
        const initialMappedRewards = allCampaigns.map(mapCampaignToReward);
        setRewards(initialMappedRewards);
        
        // Si el usuario está autenticado, buscar las campañas a las que se ha unido
        if (isAuthenticated) {
          try {
            console.log("Usuario autenticado, obteniendo campañas unidas...");
            
            // Obtener campañas a las que el usuario se ha unido
            const joinedResponse = await fetch('https://contabl.net/kleep/api/campaigns/joined', {
              headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
            
            if (joinedResponse.ok) {
              const joinedData = await joinedResponse.json();
              
              if (joinedData.campaigns && Array.isArray(joinedData.campaigns)) {
                // Crear un Set con los IDs de las campañas unidas para búsqueda eficiente
                const joinedCampaignIds = new Set(
                  joinedData.campaigns.map((campaign: {id: number}) => campaign.id)
                );
                
                // Actualizar las campañas con la información de "unido"
                const updatedCampaigns = allCampaigns.map((campaign: Campaign) => ({
                  ...campaign,
                  is_joined: joinedCampaignIds.has(campaign.id)
                }));
                
                // Actualizar estado
                setCampaigns(updatedCampaigns);
                
                // Actualizar recompensas con la nueva información
                const updatedRewards = updatedCampaigns.map(mapCampaignToReward);
                setRewards(updatedRewards);
              }
            } else {
              console.log(`Error al obtener campañas unidas: ${joinedResponse.status}`);
            }
          } catch (joinedErr) {
            // Manejar error silenciosamente para no interrumpir la experiencia principal
            console.error('Error al obtener campañas unidas:', joinedErr);
            // No mostramos este error al usuario, continuamos con las campañas sin marcar
          }
        }
        
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error('Error al cargar campañas:', errorMessage);
        setError(errorMessage);
        // No mostrar datos simulados, solo el error
        setRewards([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [isAuthenticated]);

  const handleSortBy = (sortType: string) => {
    let sortedCampaigns = [...campaigns];
    
    switch(sortType) {
      case 'most_paid':
        sortedCampaigns.sort((a, b) => parseFloat(b.budget_spent) - parseFloat(a.budget_spent));
        break;
      case 'highest_cpm':
        sortedCampaigns.sort((a, b) => parseFloat(b.price_per_view) - parseFloat(a.price_per_view));
        break;
      case 'newest':
        sortedCampaigns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        break;
    }
    
    const mappedRewards = sortedCampaigns.map(mapCampaignToReward);
    setRewards(mappedRewards);
  };

  return (
    <div className="min-h-screen bg-[#121212] p-4 lg:p-8 pl-20 lg:pl-24">
      <Sidebar />

      <div className="card bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-2 sm:p-6 md:p-2 min-h-screen w-full">
        <div className="card-body p-2">
          <h1 className="text-2xl font-bold text-white mb-2">💵 Recompensas por contenido</h1>
          <p className="text-sm text-gray-500 mb-6">Publica contenidos en las redes sociales y cobra por las visitas que generes!</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              {/* Buscador eliminado */}
            </div>

            <div className="text-right">
              <div className="inline-flex rounded-md shadow-sm gap-2">
                <button 
                  onClick={() => handleSortBy('most_paid')}
                  className="bg-[#1c1c1c] hover:bg-orange-600 text-white px-4 py-2 rounded-md">
                  Mas pagados
                </button>
                <button 
                  onClick={() => handleSortBy('highest_cpm')}
                  className="bg-[#1c1c1c] hover:bg-orange-600 text-white px-4 py-2 rounded-md">
                  CPM más alto
                </button>
                <button 
                  onClick={() => handleSortBy('newest')}
                  className="bg-[#1c1c1c] hover:bg-orange-600 text-white px-4 py-2 rounded-md">
                  Mas Recientes
                </button>
              </div>
            </div>
          </div>

          <div className="text-right mb-6">
            <p className="text-sm text-gray-300">{totalResults} Resultados</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500">Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md">
                Reintentar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {rewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                className="bg-[#1c1c1c] text-gray-400 hover:bg-[#252525] relative inline-flex items-center px-3 py-2 rounded-l-md border border-[#2a2a2a] disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <span className="sr-only">Previa</span>
                <ChevronLeft className="h-5 w-5" />
              </button>

              {Array.from({length: Math.min(5, Math.ceil(totalResults / 10))}, (_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`${
                    currentPage === i + 1 ? 'bg-[#252525] text-white' : 'bg-[#1c1c1c] text-gray-300 hover:bg-[#252525]'
                  } relative inline-flex items-center px-4 py-2 border border-[#2a2a2a]`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                className="bg-[#1c1c1c] text-gray-300 hover:bg-[#252525] relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#2a2a2a] disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalResults / 10), prev + 1))}
                disabled={currentPage >= Math.ceil(totalResults / 10)}
              >
                <span className="sr-only">Próxima</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}

