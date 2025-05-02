"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Check, Clock, AlertTriangle, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

// API endpoints
const API_BASE_URL = "https://contabl.net/kleep/api"
const VIDEOS_ENDPOINT = `${API_BASE_URL}/videos`
const BALANCE_ENDPOINT = `${API_BASE_URL}/balance`
const TIKTOK_UNVERIFIED_ACCOUNTS_ENDPOINT = `${API_BASE_URL}/tiktok-accounts/unverified`

// Tipos simplificados
interface Video {
  id: string | number
  title?: string
  url?: string
  campaign: string
  campaign_id?: number | null
  account?: string
  video_link?: string
  views: number
  views_threshold?: number
  price_per_view?: string
  status: number | string // Puede ser 0, 1, 2 o "pending", "approved", "rejected"
  status_note?: string
  payout?: string
  total_to_pay?: number
  date?: string
  created_at?: string
  account_username?: string
}

// Restauramos todos los campos del balance
interface BalanceData {
  total: number
  pending_videos: number
  approved_videos: number
  rejected_videos: number
}

interface Deposit {
  id: string
  amount: number
  rate: string
  netAmount: number
  status: "completado" | "pendiente"
  creditType: string
  date: string
}

// Interfaz mejorada para las cuentas de TikTok
interface TikTokAccount {
  id: string
  username: string
  follower_count?: number
  verification_status: "pending" | "verified" | "rejected"
  verification_date?: string
  created_at: string
  rejection_reason?: string
}

// Interfaz para campañas según el formato de la API
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
  joined_at: string;
  budget_percentage: string;
  is_joined: boolean;
}

// Función para calcular el pago de un video
const calculateVideoPayment = (video: Video): number => {
  const viewThreshold = video.views_threshold || 1000;
  const pricePerView = parseFloat(video.price_per_view || '0');
  
  if (video.views >= viewThreshold && video.status === 'approved') {
    // El precio es por cada 1000 vistas, por eso dividimos entre 1000
    return (video.views * pricePerView) / 1000;
  }
  return 0;
};

const ProfileBalance = () => {
  // Estados principales
  const [email, setEmail] = useState<string | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [userId, setUserId] = useState<number | null>(null); 
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [balance, setBalance] = useState<BalanceData>({
    total: 0,
    pending_videos: 0,
    approved_videos: 0,
    rejected_videos: 0
  })

  const fetchUserId = async (): Promise<number | null> => {
    const token = localStorage.getItem('token');
    if (!token) return null;
  
    try {
      const res = await fetch('https://contabl.net/kleep/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
  
      if (!res.ok) return null;
  
      const data = await res.json();
      return data.user?.id || null;
    } catch (e) {
      return null;
    }
  };
  
  
  // Estados de UI
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"videos" | "depositos">("videos")
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  
  // Estados para verificación de cuentas
  const [unverifiedAccounts, setUnverifiedAccounts] = useState<TikTokAccount[]>([])
  const [loadingUnverifiedAccounts, setLoadingUnverifiedAccounts] = useState(false)
  const [unverifiedAccountsError, setUnverifiedAccountsError] = useState<string | null>(null)
  const [showTiktokVerificationSection, setShowTiktokVerificationSection] = useState(false)

  const navigate = useNavigate()

  // Cargar datos al iniciar
  useEffect(() => {
    const init = async () => {
      const id = await fetchUserId();
      if (id) {
        setUserId(id);
        setEmail(localStorage.getItem("userEmail"));
        fetchBalanceData(id); // Pasamos el userId correcto
        fetchUnverifiedTikTokAccounts();
      } else {
        navigate("/signin");
      }
    };
  
    init();
  }, [navigate]);
  // Función para obtener cuentas no verificadas de TikTok
  const fetchUnverifiedTikTokAccounts = useCallback(async () => {
    setLoadingUnverifiedAccounts(true);
    setUnverifiedAccountsError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      // Hacer la petición a la API de cuentas no verificadas
      const response = await axios.get<{ success: boolean; accounts: TikTokAccount[] }>(
        TIKTOK_UNVERIFIED_ACCOUNTS_ENDPOINT,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && Array.isArray(response.data.accounts)) {
        setUnverifiedAccounts(response.data.accounts);
      } else {
        // Si no hay cuentas o la respuesta no es exitosa, inicializar con un array vacío
        setUnverifiedAccounts([]);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        setUnverifiedAccountsError('No autorizado. Verifica tu sesión.');
      } else if (error.response && error.response.status >= 500) {
        setUnverifiedAccountsError('Error del servidor. Intenta más tarde.');
      } else {
        setUnverifiedAccountsError('No se pudieron cargar las cuentas de TikTok no verificadas.');
      }
    } finally {
      setLoadingUnverifiedAccounts(false);
    }
  }, []);

  // Función para obtener campañas y videos del usuario
  const fetchBalanceData = async (uid: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      
      if (!token) {
        throw new Error('No se encontró el token de autenticación')
      }

      // Obtener el balance del servidor
      const balanceResponse = await fetch(BALANCE_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!balanceResponse.ok) {
        throw new Error(`Error al obtener datos del balance: ${balanceResponse.status}`)
      }

      const balanceData = await balanceResponse.json()

      if (balanceData.success) {
        setBalance({
          total: balanceData.balance.total,
          pending_videos: balanceData.balance.pending_videos,
          approved_videos: balanceData.balance.approved_videos,
          rejected_videos: balanceData.balance.rejected_videos
        })
      }

      // Obtener videos del usuario con user_id
      const userVideosEndpoint = `${VIDEOS_ENDPOINT}?user_id=${uid}`
      const videosResponse = await fetch(userVideosEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!videosResponse.ok) {
        throw new Error(`Error al obtener datos de videos: ${videosResponse.status}`)
      }

      // Parsear respuesta JSON de videos
      const videosData = await videosResponse.json()

      if (!videosData.success) {
        throw new Error('La respuesta de la API de videos no indica éxito')
      }

      // Obtener el ID de la campaña actual de la URL
      const currentCampaignId = window.location.pathname.match(/\/campaigns\/(\d+)/)?.[1];
      
      // Filtrar y procesar videos
      let videosList = [];
      if (videosData.videos && Array.isArray(videosData.videos)) {
        videosList = videosData.videos
        .filter((item: any) => {
          const matchesCampaign = currentCampaignId
            ? item.campaign_id === parseInt(currentCampaignId)
            : true;
      
          const matchesUser = item.user_id === uid;
      
          return matchesCampaign && matchesUser;
        })
          .map((item: any) => ({
            id: item.id,
            title: "Ver video",
            url: item.url,
            campaign: item.campaign,
            campaign_id: item.campaign_id,
            account_username: item.account || 'Verificando...',
            video_link: item.url,
            views: item.views,
            views_threshold: item.views_threshold,
            price_per_view: item.price_per_view,
            total_to_pay: calculateVideoPayment(item),
            status: item.status,
            date: item.created_at
          }));
      }

      setVideos(videosList);

      
      
    } catch (error: any) {
      setError(`No se pudieron cargar los datos: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Agregar efecto para recargar datos cuando cambie la URL
  useEffect(() => {
    // Recargar datos cuando cambie la URL (cambio de campaña)
    const currentCampaignId = window.location.pathname.match(/\/campaigns\/(\d+)/)?.[1];
if (currentCampaignId && userId !== null) {
  fetchBalanceData(userId);
}

  }, [window.location.pathname]);

  // Manejadores de eventos
  const handleShowRejectionModal = (videoId: string | number) => {
    const video = videos.find(v => String(v.id) === String(videoId))
    if (video) {
      setSelectedVideo(video)
      setShowRejectionModal(true)
    }
  }

  const handleCloseRejectionModal = () => {
    setShowRejectionModal(false)
    setSelectedVideo(null)
  }

  const handleVerificationToggle = (videoId: string | number) => {
    const video = videos.find(v => String(v.id) === String(videoId))
    if (!video) return
    
    if (video.status === 2) {
      handleShowRejectionModal(video.id)
    }
  }

  const handleNavigateToAccountsVerification = () => {
    navigate("/profile-cuentas")
  }

  // Renderizado de contenido de pestaña de videos
  const renderVideoContent = () => {
    // Mostrar mensaje de error si existe
    if (error) {
      return (
        <div className="bg-red-900/30 border border-red-700 rounded mb-6 p-4 text-red-400">
          <h3 className="font-medium mb-2">Error al cargar los datos</h3>
          <p className="mb-3">{error}</p>
          <button
            onClick={() => userId && fetchBalanceData(userId)}
            className="bg-red-700 hover:bg-red-600 text-white rounded px-3 py-1 text-sm"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }

    // Vista de escritorio: una sola tabla para todos los videos
    return (
      <>
        <div className="hidden md:block bg-[#0c0c0c] border border-[#1c1c1c] rounded">
          <table className="w-full">
            <thead className="border-b border-[#1c1c1c] text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">CAMPAÑAS</th>
                <th className="px-4 py-3 text-left">CUENTAS</th>
                <th className="px-4 py-3 text-left">VIDEO</th>
                <th className="px-4 py-3 text-right">VISTAS</th>
                <th className="px-4 py-3 text-right">TOTAL A PAGAR</th>
                <th className="px-4 py-3 text-left">ESTADO</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {videos.length > 0 ? (
                videos.map((video, i) => (
                  <tr key={`video-row-${i}`} className="border-b border-[#1c1c1c]">
                    <td className="px-4 py-3 text-white">{video.campaign || "Sin campaña"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span>{video.account_username || 'Sin nombre'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#7c3aed] flex items-center hover:underline"
                      >
                        Ver video <ExternalLink size={16} className="ml-1" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={video.views < (video.views_threshold || 1000) ? "text-yellow-500" : ""}>
                        {video.views.toLocaleString()}
                      </span>
                      {video.views < (video.views_threshold || 1000) && (
                        <span className="block text-xs text-yellow-500">
                          Mínimo {(video.views_threshold || 1000).toLocaleString()} vistas
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium">
                        ${calculateVideoPayment(video).toFixed(2)}
                        {video.views < (video.views_threshold || 1000) && (
                          <span className="block text-yellow-500 text-xs">* Pendiente de vistas</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={video.status === 'rejected' ? () => handleVerificationToggle(video.id) : undefined}
                        className={`px-3 py-1 rounded text-sm flex items-center ${
                          video.status === 'pending'
                            ? "bg-yellow-900/30 text-yellow-500 border border-yellow-700"
                            : video.status === 'approved'
                            ? "bg-green-900/30 text-green-500 border border-green-700"
                            : "bg-red-900/30 text-red-500 border border-red-700"
                        }`}
                      >
                        {video.status === 'pending' ? (
                          <><Clock size={16} className="mr-1" />En proceso</>
                        ) : video.status === 'approved' ? (
                          <><Check size={16} className="mr-1" />Aprobado</>
                        ) : (
                          <><X size={16} className="mr-1" />Rechazado</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center text-gray-400">
                    No hay videos para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista móvil: una sola lista para todos los videos */}
        <div className="md:hidden">
          {videos.length > 0 ? (
            videos.map((video, i) => (
              <div
                key={`video-mobile-${i}`}
        className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-md p-3 mb-3"
      >
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">Campaña:</p>
                    <p className="text-white">{video.campaign || "Sin campaña"}</p>
          </div>
          <div>
            <p className="text-gray-500">Creador:</p>
                    <p className="text-white">{video.account_username || 'Sin nombre'}</p>
          </div>
          <div>
            <p className="text-gray-500">Vistas:</p>
                    <p className={`${video.views < (video.views_threshold || 1000) ? "text-yellow-500" : "text-white"}`}>
              {video.views.toLocaleString()}
                      {video.views < (video.views_threshold || 1000) && (
                        <span className="block text-xs">
                          Mínimo {(video.views_threshold || 1000).toLocaleString()} vistas
                        </span>
                      )}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Total a pagar:</p>
            <p className="text-white font-medium">
                      ${calculateVideoPayment(video).toFixed(2)}
                      {video.views < (video.views_threshold || 1000) && (
                        <span className="block text-yellow-500 text-xs">Pendiente de vistas</span>
                      )}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Estado:</p>
            <button
                      onClick={video.status === 'rejected' ? () => handleVerificationToggle(video.id) : undefined}
                      className={`px-2 py-1 rounded text-xs flex items-center ${
                        video.status === 'pending'
                          ? "bg-yellow-900/30 text-yellow-500 border border-yellow-700"
                          : video.status === 'approved'
                          ? "bg-green-900/30 text-green-500 border border-green-700"
                          : "bg-red-900/30 text-red-500 border border-red-700"
                      }`}
                    >
                      {video.status === 'pending' ? (
                        <><Clock size={12} className="mr-1" />En proceso</>
                      ) : video.status === 'approved' ? (
                        <><Check size={12} className="mr-1" />Aprobado</>
                      ) : (
                        <><X size={12} className="mr-1" />Rechazado</>
                      )}
            </button>
          </div>
          <div className="col-span-2 mt-2">
            <a
                      href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7c3aed] flex items-center text-sm hover:underline"
            >
              Ver video <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
        </div>
      </div>
            ))
          ) : (
            <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-md p-3 mb-3 text-center text-gray-400">
              No hay videos para mostrar
            </div>
          )}
        </div>
      </>
    );
  };

  // Componente de carga
  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 flex justify-center items-center h-[50vh]">
        <div className="text-white flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-[#7c3aed] rounded-full mb-3"></div>
          Cargando datos...
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded mb-6 p-3 text-red-400">
          <p>{error}</p>
          <button
            onClick={() => userId && fetchBalanceData(userId)}
            className="mt-2 bg-red-700 hover:bg-red-600 text-white rounded px-3 py-1 text-sm"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Resumen de balance */}
      <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded mb-6 md:mb-8 overflow-hidden">
        <div className="flex justify-between p-3 md:p-4 font-medium">
          <span className="text-white text-sm sm:text-base">Balance general</span>
          <span className="text-white text-sm sm:text-base font-bold">{balance.total.toFixed(2)} US$</span>
        </div>
      </div>

      {/* Pestañas */}
      <div className="mb-4">
        <div className="border-b border-[#1c1c1c]">
          <div className="flex">
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === "videos" ? "text-white border-b-2 border-[#7c3aed]" : "text-gray-500 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("videos")}
            >
              Videos ({videos.length})
            </button>
            {/* <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === "depositos"
                  ? "text-white border-b-2 border-[#7c3aed]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("depositos")}
            >
              Depósitos ({deposits.length})
            </button> */}
          </div>
        </div>
      </div>

      {/* Contenido de pestañas */}
      {activeTab === "videos" && (
        <>
          {/* Reemplazar la tabla de videos por la función renderVideoContent */}
          {renderVideoContent()}

          {/* Sección de verificación de cuentas TikTok */}
          <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-lg mt-8 mb-6 p-5">
            <h2 className="text-xl font-medium mb-2">Verifica tus cuentas de TikTok</h2>
            <p className="text-gray-400 mb-3">
              Para poder procesar los pagos, es importante que verifiquemos que tu eres el dueño de la cuenta.
            </p>
            
            {loadingUnverifiedAccounts ? (
              <div className="flex items-center py-3">
                <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-[#7c3aed] rounded-full mr-3"></div>
                <p className="text-gray-400">Cargando cuentas pendientes...</p>
              </div>
            ) : unverifiedAccountsError ? (
              <div className="bg-red-900/30 border border-red-700 rounded mb-4 p-3 text-red-400">
                <p>{unverifiedAccountsError}</p>
                <button
                  onClick={fetchUnverifiedTikTokAccounts}
                  className="mt-2 bg-red-700 hover:bg-red-600 text-white rounded px-3 py-1 text-sm"
                >
                  Intentar de nuevo
                </button>
              </div>
            ) : (
              <>
                {unverifiedAccounts.length > 0 ? (
                  <div className="mb-4">
                    <div className="flex items-center mb-3">
                      <AlertTriangle className="text-yellow-500 mr-2" size={18} />
                      <p className="text-yellow-500 text-sm">
                        Tienes {unverifiedAccounts.length} {unverifiedAccounts.length === 1 ? 'cuenta pendiente' : 'cuentas pendientes'} de verificación.
                      </p>
                    </div>
                    <div className="bg-[#0c0c0c]/50 border border-[#1c1c1c] rounded p-3 mb-3">
                      <ul className="text-sm">
                        {unverifiedAccounts.slice(0, 3).map((account, index) => (
                          <li key={`unverified-${index}`} className="flex items-center mb-2 last:mb-0">
                            <Clock size={14} className="text-yellow-500 mr-2" />
                            <span>@{account.username}</span>
                          </li>
                        ))}
                        {unverifiedAccounts.length > 3 && (
                          <li className="text-gray-400 text-xs mt-1">
                            Y {unverifiedAccounts.length - 3} más...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center mb-3">
                    <Check className="text-green-500 mr-2" size={18} />
                    <p className="text-green-500 text-sm">
                      No tienes cuentas pendientes de verificación.
                    </p>
                  </div>
                )}
                
                <button
                  className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium py-2 px-4 rounded-md mt-2"
                  onClick={handleNavigateToAccountsVerification}
                >
                  Verificar Cuentas de TikTok
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Pestaña de depósitos */}
      {activeTab === "depositos" && (
        <>
          <div className="hidden md:block bg-[#0c0c0c] border border-[#1c1c1c] rounded">
            <table className="w-full">
              <thead className="border-b border-[#1c1c1c] text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">IMPORTE</th>
                  <th className="px-4 py-3 text-left">TASA</th>
                  <th className="px-4 py-3 text-left">IMPORTE NETO</th>
                  <th className="px-4 py-3 text-left">ESTADO</th>
                  <th className="px-4 py-3 text-left">TIPO DE CRÉDITO</th>
                  <th className="px-4 py-3 text-left">FECHA DE PUBLICACIÓN</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {deposits.length > 0 ? (
                  deposits.map((deposit, i) => (
                    <tr key={`deposit-row-${i}`} className="border-b border-[#1c1c1c]">
                      <td className="px-4 py-3">${deposit.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">{deposit.rate}</td>
                      <td className="px-4 py-3">${deposit.netAmount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded text-sm inline-block
                          ${
                            deposit.status === "completado"
                              ? "bg-green-900/30 text-green-500 border border-green-700"
                              : "bg-yellow-900/30 text-yellow-500 border border-yellow-700"
                          }`}
                        >
                          {deposit.status === "completado" ? "Completado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{deposit.creditType}</td>
                      <td className="px-4 py-3">{deposit.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center">
                      No hay depósitos disponibles para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Vista móvil de depósitos */}
          <div className="md:hidden">
            {deposits.length > 0 ? (
              deposits.map((deposit, i) => (
                <div
                  key={`deposit-mobile-${i}`}
                  className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-md p-3 mb-3"
                >
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Importe:</p>
                      <p className="text-white">${deposit.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tasa:</p>
                      <p className="text-white">{deposit.rate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Importe Neto:</p>
                      <p className="text-white">${deposit.netAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Estado:</p>
                      <span
                        className={`px-2 py-1 rounded text-xs inline-block
                        ${
                          deposit.status === "completado"
                            ? "bg-green-900/30 text-green-500 border border-green-700"
                            : "bg-yellow-900/30 text-yellow-500 border border-yellow-700"
                        }`}
                      >
                        {deposit.status === "completado" ? "Completado" : "Pendiente"}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Tipo de Crédito:</p>
                      <p className="text-white">{deposit.creditType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fecha:</p>
                      <p className="text-white">{deposit.date}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded p-4 text-center text-white">
                No hay depósitos disponibles para mostrar.
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de rechazo */}
      {showRejectionModal && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-75" onClick={handleCloseRejectionModal}></div>
          <div className="relative bg-[#0c0c0c] rounded-lg w-11/12 max-w-md mx-auto p-5 text-white border border-[#1c1c1c]">
            <button
              onClick={handleCloseRejectionModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-6">Tu video no ha sido aceptado</h3>
              <p className="text-gray-400 mb-2">MOTIVO:</p>
              {selectedVideo.status_note ? (
                <p className="text-sm text-red-400 whitespace-pre-line max-w-xs mx-auto">
                  {selectedVideo.status_note}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic mb-6">Sin motivo especificado.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileBalance
