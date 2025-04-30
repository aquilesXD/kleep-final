"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/layout/Sidebar";
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { RewardCard } from "./RewardCard";
import { getAuthToken } from '../../services/authService';

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
    banner_image: campaign.banner_image,
    creator: campaign.admin_name,
    title: campaign.name,
    paidAmount: campaign.budget_spent,
    totalAmount: campaign.total_budget,
    percentage: parseInt(campaign.budget_percentage),
    type: campaign.type,
    platform: campaign.platforms,
    rate: campaign.price_per_view,
    isJoined: campaign.is_joined,
    created_at: campaign.created_at
  };
}

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [rewards, setRewards] = useState<any[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [activeSort, setActiveSort] = useState<string | null>('highest_cpm')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const userEmail = localStorage.getItem("userEmail");
    const token = localStorage.getItem("token") || 
                 localStorage.getItem("authToken") || 
                 sessionStorage.getItem("token") || 
                 sessionStorage.getItem("authToken");
    
    const isAuth = Boolean(authStatus && (userEmail || token));
    setIsAuthenticated(isAuth);
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        // Endpoint público para todas las campañas
        const publicEndpoint = 'https://contabl.net/kleep/api/campaigns/public';
        
        // Headers básicos
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        let joinedCampaignIds = new Set<number>();

        // Si el usuario está autenticado, obtener las campañas unidas
        if (token && isAuthenticated) {
          try {
            const joinedResponse = await fetch('https://contabl.net/kleep/api/campaigns/joined', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            });

            if (joinedResponse.ok) {
              const joinedData = await joinedResponse.json();
              if (joinedData.campaigns && Array.isArray(joinedData.campaigns)) {
                joinedCampaignIds = new Set(
                  joinedData.campaigns.map((campaign: { id: number }) => campaign.id)
                );
              }
            }
          } catch (joinedErr) {
            console.error('Error al obtener campañas unidas:', joinedErr);
          }
        }

        // Obtener todas las campañas del endpoint público
        const response = await fetch(publicEndpoint, { headers });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error al cargar las campañas (${response.status}):`, errorText);
          throw new Error(`Error al cargar las campañas (${response.status})`);
        }

        const data = await response.json();

        if (!data.campaigns) {
          throw new Error('Formato de respuesta inválido: no se encontraron campañas');
        }

        // Marcar las campañas como unidas si el usuario está autenticado
        const allCampaigns = data.campaigns.map((campaign: Campaign) => ({
          ...campaign,
          is_joined: joinedCampaignIds.has(campaign.id),
        }));

        setCampaigns(allCampaigns);
        setTotalResults(allCampaigns.length);
        const mappedRewards = allCampaigns.map(mapCampaignToReward);
        setRewards(mappedRewards);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        setRewards([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [isAuthenticated]); // Mantener la dependencia de isAuthenticated

  // Aplicar el ordenamiento inicial cuando se cargan las campañas
  useEffect(() => {
    if (campaigns.length > 0) {
      handleSortBy('highest_cpm');
    }
  }, [campaigns]);

  const handleSortBy = (sortType: string) => {
    // Si se hace clic en el mismo tipo de ordenamiento, cambia la dirección
    if (activeSort === sortType) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setActiveSort(sortType)
      setSortDirection('desc') // Por defecto, orden descendente
    }

    let sortedCampaigns = [...campaigns];
    
    switch(sortType) {
      case 'most_paid':
        sortedCampaigns.sort((a, b) => {
          const diff = parseFloat(b.budget_spent) - parseFloat(a.budget_spent)
          return sortDirection === 'desc' ? diff : -diff
        });
        break;
      case 'highest_cpm':
        // Filtrar solo las campañas con CPM más alto
        sortedCampaigns = sortedCampaigns.filter(campaign => {
          const cpm = parseFloat(campaign.price_per_view);
          return cpm > 0; // Solo mostrar campañas con CPM positivo
        }).sort((a, b) => {
          const diff = parseFloat(b.price_per_view) - parseFloat(a.price_per_view)
          return sortDirection === 'desc' ? diff : -diff
        });
        break;
      case 'newest':
        sortedCampaigns.sort((a, b) => {
          const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          return sortDirection === 'desc' ? diff : -diff
        });
        break;
      default:
        break;
    }
    
    const mappedRewards = sortedCampaigns.map(mapCampaignToReward);
    setRewards(mappedRewards);
    setTotalResults(mappedRewards.length); // Actualizar el total de resultados
  };

  return (
    <div className="min-h-screen bg-[#121212] p-4 lg:p-8 pl-20 lg:pl-24">
      <Sidebar />

      <div className="card bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-2 sm:p-6 md:p-2 min-h-screen w-full">
        <div className="card-body p-2">
          <h1 className="text-2xl font-bold text-white mb-2">💵 Recompensas por contenido</h1>
          <p className="text-sm text-gray-500 mb-6">Publica contenidos en las redes sociales y cobra por las visitas que generes!</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div></div>

            <div className="text-right">
              {/* Botones adaptados */}
              <div className="inline-flex rounded-md shadow-sm gap-2">
                <button 
                  onClick={() => handleSortBy('most_paid')}
                  className={`
                    px-4 py-2 rounded-md transition-colors text-white flex items-center gap-1
                    ${activeSort === 'most_paid' ? 'bg-blue-500' : 'bg-[#1c1c1c] hover:bg-violet-600'}
                  `}
                >
                  Más pagados
                  {activeSort === 'most_paid' && (
                    <span className="text-sm">
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => handleSortBy('highest_cpm')}
                  className={`
                    px-4 py-2 rounded-md transition-colors text-white flex items-center gap-1
                    ${activeSort === 'highest_cpm' ? 'bg-blue-500' : 'bg-[#1c1c1c] hover:bg-violet-600'}
                  `}
                >
                  CPM
                  {activeSort === 'highest_cpm' && (
                    <span className="text-sm">
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => handleSortBy('newest')}
                  className={`                    px-4 py-2 rounded-md transition-colors text-white flex items-center gap-1
                    ${activeSort === 'newest' ? 'bg-blue-500' : 'bg-[#1c1c1c] hover:bg-violet-600'}
                  `}
                >
                  Más recientes
                  {activeSort === 'newest' && (
                    <span className="text-sm">
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="text-right mb-6">
            <p className="text-sm text-gray-300">{totalResults} Resultados</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500">Error: {error}</p>
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

