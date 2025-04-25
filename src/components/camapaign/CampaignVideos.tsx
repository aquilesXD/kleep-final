import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../layout/Sidebar';

import { AlertTriangle, ExternalLink, Clock, Check, X } from 'lucide-react';
import { CampaignSidebar } from '../layout/CampainSidebar';

// Interfaces para los datos
interface VideoItem {
  id: number;
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
  payout: string; // Agregado para coincidir con la API
  account: string; // Agregado para coincidir con la API
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

// Get auth token from localStorage or sessionStorage
const getAuthToken = (): string => {
  return localStorage.getItem("authToken") || 
         localStorage.getItem("token") || 
         sessionStorage.getItem("authToken") || 
         sessionStorage.getItem("token") || 
         ""; // Devuelve cadena vacía si no encuentra token
};

export default function CampaignVideos() {
  const { campaignId = "1" } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [unverifiedAccounts, setUnverifiedAccounts] = useState<UnverifiedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  // Obtener los videos y las cuentas no verificadas
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setIsAuthError(false);

      const token = getAuthToken();
      if (!token) {
        setIsAuthError(true);
        throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
      }

      // Configuración de headers para las peticiones
      const headers = {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // 1. Obtener los videos de la campaña
      const videosResponse = await fetch(`https://contabl.net/kleep/api/campaigns/1/my-videos`, {
        headers
      });

      if (!videosResponse.ok) {
        throw new Error(`Error al cargar los videos (${videosResponse.status})`);
      }

      const data: ApiResponse = await videosResponse.json();

      // 2. Obtener las cuentas no verificadas
      const unverifiedAccountsResponse = await fetch('https://contabl.net/kleep/api/tiktok-accounts/unverified', {
        headers
      });

      if (!unverifiedAccountsResponse.ok) {
        // Continuamos incluso si hay error, para al menos mostrar los videos
      } else {
        const accountsData: UnverifiedAccountsResponse = await unverifiedAccountsResponse.json();
        
        // Si la respuesta es exitosa, actualizamos las cuentas no verificadas
        if (accountsData.success && accountsData.accounts) {
          setUnverifiedAccounts(accountsData.accounts);
        }
      }

      if (data.success) {
        const videos = data.videos.map(video => ({
          id: video.id,
          url: video.url,
          views: video.views,
          status: video.status,
          payment_amount: parseFloat(video.payout),
          created_at: video.created_at,
          title: video.title || "Ver video",
          description: video.description || "Descripción no disponible",
          account_id: video.account_id || 0,
          account_username: video.account || "@desconocido",
          payout: video.payout,
          account: video.account
        }));

        setVideos(videos);
        
        // Si también nos llegaron cuentas no verificadas de la primera petición, las usamos como respaldo
        if (data.unverified_accounts && data.unverified_accounts.length > 0 && unverifiedAccounts.length === 0) {
          setUnverifiedAccounts(data.unverified_accounts);
        }
        
        setError(null);
      } else {
        throw new Error('Error al obtener los datos de videos');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Función para formatear el nombre de usuario
  const formatUsername = (username: string | undefined | null): string => {
    // Si el username es undefined o null, devolver un valor por defecto
    if (!username) return "@desconocido";

    // Si ya tiene @ al principio, devolverlo tal cual
    return username.startsWith('@') ? username : `@${username}`;
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
        <p className="text-white ml-4">Cargando videos...</p>
      </div>
    );
  }

  // Mostrar mensaje de error
  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Sidebar />
      <div className="pl-20 lg:pl-24">
        <div className="flex flex-col lg:flex-row">
          <CampaignSidebar activeItem="videos" />
          <div className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">MIS VIDEOS</h1>

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

            {/* Sección de cuentas no verificadas */}
            <div className="mt-10 bg-[#111] border border-[#222] rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Verifica tus cuentas de TikTok
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Para poder procesar los pagos, es importante que verifiquemos que tú eres el dueño
                de la cuenta.
              </p>
              
              {unverifiedAccounts.length > 0 ? (
                <>
                  <div className="flex items-start mb-4">
                    <AlertTriangle size={18} className="text-yellow-500 mr-2 mt-0.5" />
                    <p className="text-yellow-500 text-sm">
                      Este paso es obligatorio para recibir pagos.
                    </p>
                  </div>
                  
                  <div className="bg-[#0c0c0c]/50 border border-[#1c1c1c] rounded p-4 mb-6">
                    <h4 className="text-white font-medium mb-3">Cuentas pendientes de verificación:</h4>
                    <div className="space-y-3">
                      {unverifiedAccounts.map((acc) => (
                        <div key={acc.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0c0c0c] p-3 border border-[#222] rounded-md">
                          <div className="mb-2 sm:mb-0">
                            <p className="text-white font-medium">{formatUsername(acc.username)}</p>
                            <p className="text-xs text-gray-400">Registrada: {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : 'Fecha desconocida'}</p>
                          </div>
                          <div className="flex flex-col items-start sm:items-end">
                            <p className="text-gray-400 text-xs">Código de verificación:</p>
                            <p className="text-violet-400 font-mono font-bold">{acc.verification_code}</p>
                          </div>
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
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium py-2 px-4 rounded transition-colors"
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