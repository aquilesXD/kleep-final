import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';

import { AlertTriangle, ExternalLink } from 'lucide-react';
import { CampaignSidebar } from '../layout/CampainSidebar';

interface VideoItem {
  id: string;
  email: string;
  video_link: string;
  views: number;
  total_to_pay: number;
  status: number;
  status_note?: string;
  creator?: string;
}

export default function CampaignVideos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [pendingAccounts, setPendingAccounts] = useState<string[]>([]);

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const userEmail = localStorage.getItem("userEmail");

    // Verificar que tanto isAuthenticated como userEmail existan
    if (!isAuthenticated || !userEmail) {
      // Limpiar cualquier dato de sesión parcial
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("apiResponse");

      // Redirigir al inicio de sesión
      navigate("/signin");
    }
  }, [navigate]);

  const findCreatorByEmail = (email: string): string | undefined => {
    try {
      const accounts = JSON.parse(localStorage.getItem('connectedAccounts') || '[]');
      const match = accounts.find((acc: any) => acc.email === email);
      return match?.username;
    } catch {
      return undefined;
    }
  };

  const extractCreatorFromLink = (link: string): string | null => {
    const match = link?.match(/@([^/]+)\/video/);
    return match ? match[1] : null;
  };

  const processData = (data: any[]) => {
    return data.map((item) => {
      const creatorFromEmail = findCreatorByEmail(item.email);
      const creatorFromLink = extractCreatorFromLink(item.video_link);
      const fallbackCreator = creatorFromEmail || creatorFromLink || '';

      const status = Number(item.status);

      return {
        ...item,
        creator: item.creator || fallbackCreator,
        total_to_pay: parseFloat(item.total_to_pay || '0'),
        status,
        status_note: item.status_note || '',
      };
    });
  };

  const fetchVideos = async () => {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    try {
      const res = await fetch(`https://contabl.net/nova/get-videos-to-pay?email=${email}`);
      const json = await res.json();
      if (Array.isArray(json.data)) {
        const processed = processData(json.data);
        setVideos(processed);

        // ✅ Mismo filtro que ProfileBalance
        const uniqueCreators = [
          ...new Set(
            processed
              .filter((v) => v.status !== 1 && v.creator)
              .map((v) => v.creator!)
          ),
        ];
        setPendingAccounts(uniqueCreators);
      }
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleShowRejectionModal = (video: VideoItem) => {
    setSelectedVideo(video);
    setShowRejectionModal(true);
  };

  const handleCloseRejectionModal = () => {
    setShowRejectionModal(false);
    setSelectedVideo(null);
  };


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
               <th className="px-4 py-3">Cuenta</th>
               <th className="px-4 py-3">Video</th>
               <th className="px-4 py-3 text-right">Vistas</th>
               <th className="px-4 py-3 text-right">Total a pagar</th>
               <th className="px-4 py-3 text-center w-36">Estado</th>  {/* Encabezado centrado */}
              </tr>
              </thead>
                <tbody>
                  {videos.map((video) => {
                    const hasSufficientViews = (video.views || 0) >= 2000;

                    let statusStyle = "";
                    let statusIcon = null;

                    if (video.status === 0) {
                    statusStyle = "border border-yellow-500 text-yellow-500";
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
                  } else if (video.status === 1) {
                  statusStyle = "border border-green-500 text-green-500";
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
                    } else if (video.status === 2) {
                  statusStyle = "border border-red-500 text-red-500";
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

                 const getStatusText = (status: number): string => {
                 switch (status) {
                 case 0:
                  return "En proceso";
                  case 1:
                   return "Aprobado";
                  case 2:
                  return "Rechazado";
                  default:
                   return "Desconocido";
                     }
                    };

                    return (
                      <tr key={video.id} className="border-t border-[#222]">
                        <td className="px-4 py-3">{video.creator || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <a
                            href={video.video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-500 flex items-center"
                          >
                            Ver video <ExternalLink size={14} className="ml-1" />
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
                            {hasSufficientViews
                              ? `$${video.total_to_pay.toFixed(2)}`
                              : '$0.00'}
                            {!hasSufficientViews && (
                              <span className="block text-yellow-500 text-xs">
                                * Pendiente de vistas
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                        {video.status === 2 ? (
                        <button
                         onClick={() => handleShowRejectionModal(video)}
                         className={`w-36 justify-center px-3 py-1 rounded text-sm flex items-center ${statusStyle} hover:opacity-80 transition`}
                          >
                         {statusIcon} {getStatusText(video.status)}
                         </button>
                         ) : (
                         <span
                         className={`w-36 justify-center px-3 py-1 rounded text-sm flex items-center ${statusStyle}`}
                          >
                          {statusIcon} {getStatusText(video.status)}
                          </span>
                          )}
                         </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pendingAccounts.length > 0 && (
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
                  {pendingAccounts.map((acc) => (
                    <button
                      key={acc}
                      className="px-3 py-1 rounded-full text-sm bg-gray-800 text-white border border-gray-600 hover:bg-gray-700 transition"
                    >
                      @{acc}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/profile-cuentas')}
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
