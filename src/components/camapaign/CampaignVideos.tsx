import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../layout/Sidebar';

import { AlertTriangle, ExternalLink } from 'lucide-react';
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
}

interface UnverifiedAccount {
  id: number;
  username: string;
  verification_code: string;
}

interface ApiResponse {
  success: boolean;
  videos: VideoItem[];
  unverified_accounts: UnverifiedAccount[];
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
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  // Obtener los videos y las cuentas no verificadas
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setIsAuthError(false);
      
      // Obtener el token mediante la función getAuthToken
      const token = getAuthToken();
      
      // Verificar que haya un token válido
      if (!token) {
        setIsAuthError(true);
        throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
      }
      
      // Intentar hacer la petición con el formato Bearer
      let response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/my-videos`, {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Si el error es 401 (No autorizado), intentar con formatos alternativos
      if (response.status === 401) {
        // Intentar con formato alternativo (solo token sin Bearer)
        response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/my-videos`, {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        // Si sigue fallando, intentar con query param
        if (response.status === 401) {
          response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/my-videos?api_token=${token}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          // Si sigue fallando, es un problema de autenticación real
          if (response.status === 401) {
            setIsAuthError(true);
            throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          }
        }
      }

      if (!response.ok) {
        throw new Error(`Error al cargar los videos (${response.status})`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setVideos(data.videos || []);
        setUnverifiedAccounts(data.unverified_accounts || []);
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
  }, [campaignId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleShowRejectionModal = (video: VideoItem) => {
    setSelectedVideo(video);
    setShowRejectionModal(true);
  };

  const handleCloseRejectionModal = () => {
    setShowRejectionModal(false);
    setSelectedVideo(null);
  };

  // Función para formatear el nombre de usuario
  const formatUsername = (username: string): string => {
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
                    <th className="px-4 py-3 text-center w-36">Estado</th>
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
                      const hasSufficientViews = (video.views || 0) >= 2000;

                      let statusStyle = "";
                      let statusIcon = null;
                      let statusText = "";

                      if (video.status === 'pending') {
                        statusStyle = "border border-yellow-500 text-yellow-500";
                        statusText = "En proceso";
                        statusIcon = (
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        );
                      } else if (video.status === 'approved') {
                        statusStyle = "border border-green-500 text-green-500";
                        statusText = "Aprobado";
                        statusIcon = (
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M20 6L9 17L4 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        );
                      } else if (video.status === 'rejected') {
                        statusStyle = "border border-red-500 text-red-500";
                        statusText = "Rechazado";
                        statusIcon = (
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M18 6L6 18M6 6L18 18"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        );
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
                              {video.title || 'Ver video'} <ExternalLink size={14} className="ml-1" />
                            </a>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={!hasSufficientViews ? 'text-yellow-500' : ''}>
                              {video.views?.toLocaleString() || '0'}
                              {!hasSufficientViews && (
                                <span className="block text-xs">Mínimo 2000 vistas</span>
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
                            {video.status === 'rejected' ? (
                              <button
                                onClick={() => handleShowRejectionModal(video)}
                                className={`w-36 justify-center px-3 py-1 rounded text-sm flex items-center ${statusStyle} hover:opacity-80 transition`}
                              >
                                {statusIcon} {statusText}
                              </button>
                            ) : (
                              <span
                                className={`w-36 justify-center px-3 py-1 rounded text-sm flex items-center ${statusStyle}`}
                              >
                                {statusIcon} {statusText}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {unverifiedAccounts.length > 0 && (
              <div className="mt-10">
                <h3 className="text-white font-semibold text-lg mb-2">
                  Verifica tus cuentas de TikTok
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Para poder procesar los pagos, es importante que verifiquemos que tú eres el dueño
                  de la cuenta.
                </p>
                <div className="flex items-start mb-4">
                  <AlertTriangle size={18} className="text-yellow-500 mr-2 mt-0.5" />
                  <p className="text-yellow-500 text-sm">
                    Este paso es obligatorio para recibir pagos.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {unverifiedAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      className="px-3 py-1 rounded-full text-sm bg-gray-800 text-white border border-gray-600 hover:bg-gray-700 transition"
                    >
                      {formatUsername(acc.username)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Verificar Cuentas de TikTok
                </button>
              </div>
            )}

            {showRejectionModal && selectedVideo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black bg-opacity-75"
                  onClick={handleCloseRejectionModal}
                ></div>
                <div className="relative bg-[#0c0c0c] rounded-lg w-11/12 max-w-md mx-auto p-5 text-white border border-[#1c1c1c]">
                  <button
                    onClick={handleCloseRejectionModal}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-6">Tu video no ha sido aceptado</h3>
                    <p className="text-gray-400 mb-2">MOTIVO:</p>
                    <div className="flex mb-6 justify-center">
                      <p className="text-sm text-red-400 whitespace-pre-line text-center">
                        {selectedVideo.status_note || 'Sin motivo especificado.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
