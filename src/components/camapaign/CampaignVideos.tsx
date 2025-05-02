import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../layout/Sidebar';
import { AlertTriangle, ExternalLink, Clock, Check, X } from 'lucide-react';
import { CampaignSidebar } from '../layout/CampainSidebar';

// Interfaces
interface VideoItem {
  id: number;
  user_id: number;
  url: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  status_note?: string;
  views: number;
  payment_amount: number;
  created_at: string;
  account_id: number;
  account_username: string;
  payout: string;
  account: string | null;
  campaign: string;
  campaign_id: number;
  views_threshold: number;
  price_per_view: string;
}

interface UnverifiedAccount {
  id: number;
  username: string;
  verification_code: string;
  created_at?: string;
}

interface ApiResponse {
  success: boolean;
  videos: VideoItem[];
  unverified_accounts?: UnverifiedAccount[];
}

interface UnverifiedAccountsResponse {
  success: boolean;
  accounts: UnverifiedAccount[];
}

interface UserResponse {
  success: boolean;
  user: { id: number };
}

// Token auth helper
const getAuthToken = (): string => {
  return localStorage.getItem("authToken") ||
         localStorage.getItem("token") ||
         sessionStorage.getItem("authToken") ||
         sessionStorage.getItem("token") || "";
};

export default function CampaignVideos() {
  const { campaignId = "1" } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [unverifiedAccounts, setUnverifiedAccounts] = useState<UnverifiedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchUserId = async (): Promise<number | null> => {
    try {
      const token = getAuthToken();
      if (!token) return null;

      const headers = {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const response = await fetch('https://contabl.net/kleep/api/user', { headers });
      if (!response.ok) return null;

      const data: UserResponse = await response.json();
      return data.user?.id || null;
    } catch {
      return null;
    }
  };

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setIsAuthError(false);

      const token = getAuthToken();
      if (!token || userId === null) {
        setIsAuthError(true);
        throw new Error('Token o ID de usuario no encontrado. Por favor, inicia sesión.');
      }

      const headers = {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const videosResponse = await fetch(`https://contabl.net/kleep/api/videos`, { headers });
      if (!videosResponse.ok) throw new Error(`Error al cargar videos (${videosResponse.status})`);

      const data: ApiResponse = await videosResponse.json();

      const unverifiedAccountsResponse = await fetch('https://contabl.net/kleep/api/tiktok-accounts/unverified', { headers });
      if (unverifiedAccountsResponse.ok) {
        const accountsData: UnverifiedAccountsResponse = await unverifiedAccountsResponse.json();
        if (accountsData.success && accountsData.accounts) {
          setUnverifiedAccounts(accountsData.accounts);
        }
      }
      
      if (data.success) {
        const filtered = data.videos
  .filter(video =>
    video.user_id === userId &&
    video.campaign_id === parseInt(campaignId)
  )
  .map(video => ({
    ...video,
    title: "Ver video",
    description: `Campaña: ${video.campaign}`,
    account_username: video.account || "@Verificando..."
  }));
        setVideos(filtered);

        if (data.unverified_accounts && data.unverified_accounts.length > 0 && unverifiedAccounts.length === 0) {
          setUnverifiedAccounts(data.unverified_accounts);
        }

        setError(null);
      } else {
        throw new Error('Error al obtener los videos');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [campaignId, userId]);

  useEffect(() => {
    const init = async () => {
      const id = await fetchUserId();
      if (id !== null) setUserId(id);
      else setIsAuthError(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (userId !== null) {
      fetchVideos();
    }
  }, [fetchVideos, userId]);

  const formatUsername = (username: string | undefined | null): string => {
    if (!username) return "desconocido";
    return username.startsWith('@') ? username.substring(1) : username;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
        <p className="text-white ml-4">Cargando videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4">
        <p className="text-red-500 text-xl text-center">{error}</p>
        {isAuthError && (
          <button
            onClick={() => navigate('/signin')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
            Iniciar sesión
          </button>
        )}
      </div>
    );
  }


  // Renderizado para vista móvil de la tabla
  const renderMobileVideoCards = () => {
    if (videos.length === 0) {
      return (
        <div className="p-4 bg-[#181818] rounded-lg text-center">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h18M3 16h18"></path>
          </svg>
          <p className="text-lg font-medium text-white mb-2">No has enviado videos aún</p>
        </div>
      );
    }

    return videos.map((video) => {
      const hasSufficientViews = (video.views || 0) >= 1000;

      // Determinar el texto del estado
      let statusText = "";
      let statusClass = "";
      let statusIcon = null;
      
      if (video.status === 'pending') {
        statusText = "En proceso";
        statusClass = "bg-yellow-900/30 text-yellow-500 border border-yellow-700";
        statusIcon = <Clock size={12} className="mr-1" />;
      } else if (video.status === 'approved') {
        statusText = "Aprobado";
        statusClass = "bg-green-900/30 text-green-500 border border-green-700";
        statusIcon = <Check size={12} className="mr-1" />;
      } else if (video.status === 'rejected') {
        statusText = "Rechazado";
        statusClass = "bg-red-900/30 text-red-500 border border-red-700";
        statusIcon = <X size={12} className="mr-1" />;
      }

      return (
        <div key={video.id} className="mb-4 bg-[#181818] p-4 rounded-lg border border-[#2a2a2a]">
          <div className="flex justify-between items-start mb-3">
            <p className="text-white font-medium">{formatUsername(video.account_username)}</p>
            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${statusClass}`}>
              {statusIcon}
              <span>{statusText}</span>
            </div>
          </div>
          
          <div className="mb-3">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-500 flex items-center"
            >
              {video.title !== "Ver video" ? video.title : "Ver video"} <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-400">Vistas</p>
              <p className={`font-medium ${!hasSufficientViews ? 'text-yellow-500' : 'text-white'}`}>
                {video.views?.toLocaleString() || '0'}
                {!hasSufficientViews && (
                  <span className="block text-xs">Mínimo 1000 vistas</span>
                )}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-400">Pago</p>
              <p className="text-white font-medium">
                ${video.payment_amount?.toFixed(2) || '0.00'}
                {!hasSufficientViews && (
                  <span className="block text-yellow-500 text-xs">
                    Pendiente de vistas
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Sidebar />
      <div className="pl-16 sm:pl-20 lg:pl-24">
        <div className="flex flex-col lg:flex-row">
          <CampaignSidebar activeItem="videos" />
          <div className="flex-1 p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">MIS VIDEOS</h1>

            {isMobile ? (
              // Vista móvil: Tarjetas en lugar de tabla
              <div className="space-y-2">
                {renderMobileVideoCards()}
              </div>
            ) : (
              // Vista desktop: Tabla
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-white border border-[#222]">
                  <thead className="text-xs uppercase bg-[#111] text-gray-400">
                    <tr>
                      <th className="px-4 py-3">CUENTA</th>
                      <th className="px-4 py-3">Video</th>
                      <th className="px-4 py-3 text-right">Vistas</th>
                      <th className="px-4 py-3 text-right">Total a pagar</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h18M3 16h18"></path>
                            </svg>
                            <p className="text-lg font-medium text-white mb-2">No has enviado videos aún</p>
                            
                          </div>
                        </td>
                      </tr>
                    ) : (
                      videos.map((video) => {
                        const hasSufficientViews = (video.views || 0) >= 1000;

                        // Determinar el texto del estado
                        let statusText = "";
                        let statusClass = "";
                        let statusIcon = null;
                        
                        if (video.status === 'pending') {
                          statusText = "En proceso";
                          statusClass = "bg-yellow-900/30 text-yellow-500 border border-yellow-700";
                          statusIcon = <Clock size={12} className="mr-1" />;
                        } else if (video.status === 'approved') {
                          statusText = "Aprobado";
                          statusClass = "bg-green-900/30 text-green-500 border border-green-700";
                          statusIcon = <Check size={12} className="mr-1" />;
                        } else if (video.status === 'rejected') {
                          statusText = "Rechazado";
                          statusClass = "bg-red-900/30 text-red-500 border border-red-700";
                          statusIcon = <X size={12} className="mr-1" />;
                        }

                        return (
                          <tr key={video.id} className="border-t border-[#222]">
                            <td className="px-4 py-3">{formatUsername(video.account_username)}</td>
                            <td className="px-4 py-3">
                              <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-violet-500 flex items-center"
                              >
                                {video.title !== "Ver video" ? video.title : "Ver video"} <ExternalLink size={14} className="ml-1" />
                              </a>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={!hasSufficientViews ? 'text-yellow-500' : ''}>
                                {video.views?.toLocaleString() || '0'}
                                {!hasSufficientViews && (
                                  <span className="block text-xs">Mínimo 1000 vistas</span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-white font-medium">
                                ${video.payment_amount?.toFixed(2) || '0.00'}
                                {!hasSufficientViews && (
                                  <span className="block text-yellow-500 text-xs">
                                    * Pendiente de vistas
                                  </span>
                                )}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${statusClass}`}>
                                {statusIcon}
                                <span>{statusText}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sección de cuentas no verificadas - Adaptada para móvil */}
            <div className="mt-8 bg-[#111] border border-[#222] rounded-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                Verifica tus cuentas de TikTok
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Para poder procesar los pagos, es importante que verifiquemos que tú eres el dueño
                de la cuenta.
              </p>
              
              {unverifiedAccounts.length > 0 ? (
                <>
                  <div className="">
                  <div className="flex items-center mb-3">
                      <AlertTriangle className="text-yellow-500 mr-2" size={18} />
                      <p className="text-yellow-500 text-sm">
                        Tienes {unverifiedAccounts.length} {unverifiedAccounts.length === 1 ? 'cuenta pendiente' : 'cuentas pendientes'} de verificación.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {unverifiedAccounts.map((acc) => (
                        <div key={acc.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0c0c0c] p-3 border border-[#222] rounded-md">
                         <button className="text-white font-medium hover:text-violet-400 transition-colors flex items-center gap-2">
                           <Clock size={16} className="text-yellow-400" />
                           {formatUsername(acc.username)}
                         </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs mt-3">
                      Utiliza estos códigos para verificar tu cuenta en TikTok siguiendo las instrucciones de verificación.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center mb-4 text-green-500">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17L4 12"></path>
                  </svg>
                  <p>No tienes cuentas pendientes de verificación.</p>
                </div>
              )}

              <button
                onClick={() => navigate('/profile-cuentas')}
                className="w-full sm:w-auto bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Verificar Cuentas de TikTok
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}