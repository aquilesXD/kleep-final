"use client"

import { useState, useEffect, useCallback } from "react"
import { ExternalLink, Check, Clock, AlertTriangle, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

// API endpoints
const API_BASE_URL = "https://contabl.net/kleep/api"
const BALANCE_ENDPOINT = `${API_BASE_URL}/balance`
const TIKTOK_UNVERIFIED_ACCOUNTS_ENDPOINT = `${API_BASE_URL}/tiktok-accounts/unverified`

// Tipos simplificados
interface Video {
  id: string | number
  title?: string
  url?: string
  campaign: string
  campaign_id?: number | null
  creator?: string
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

const ProfileBalance = () => {
  // Estados principales
  const [email, setEmail] = useState<string | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [balance, setBalance] = useState<BalanceData>({
    total: 0,
    pending_videos: 0,
    approved_videos: 0,
    rejected_videos: 0
  })
  
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
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const userEmail = localStorage.getItem("userEmail")
    
    if (!isAuthenticated || !userEmail) {
      navigate("/signin")
      return
    }

    setEmail(userEmail)
    fetchBalanceData()
    fetchUnverifiedTikTokAccounts() // Cargar cuentas no verificadas
  }, [navigate])

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
  const fetchBalanceData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No se encontró el token de autenticación')
      }

      // Obtener datos de balance general
      const balanceResponse = await fetch(BALANCE_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!balanceResponse.ok) {
        throw new Error(`Error al obtener datos de balance: ${balanceResponse.status}`)
      }

      // Parsear respuesta JSON del balance
      const balanceData = await balanceResponse.json()

      if (!balanceData.success) {
        throw new Error('La respuesta de la API de balance no indica éxito')
      }

      // Obtener campañas a las que está unido el usuario
      const campaignsResponse = await fetch(`${API_BASE_URL}/campaigns/joined`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const campaignsData = await campaignsResponse.json();

      // Establecer campañas directamente desde la respuesta
      if (campaignsData.success && campaignsData.campaigns) {
        setCampaigns(campaignsData.campaigns);
      } else {
        setCampaigns([]);
      }

      let videosList = [];
      
      // Procesar videos del balance
      if (balanceData.videos && Array.isArray(balanceData.videos) && balanceData.videos.length > 0) {
        videosList = balanceData.videos.map((item: any, index: number) => {
          // Normalizar estado: "pending"/"approved"/"rejected" a 0/1/2
          let numStatus = 0;
          if (typeof item.status === 'string') {
            if (item.status === 'approved') numStatus = 1;
            else if (item.status === 'rejected') numStatus = 2;
          } else if (typeof item.status === 'number') {
            numStatus = item.status;
          }

          return {
            id: item.id || `video-${index}`,
            title: item.title || `Vídeo ${index + 1}`,
            url: item.url || '',
            campaign: item.campaign || "Campaña estándar",
            campaign_id: item.campaign_id || null,
            creator: item.creator || item.account || '',
            account: item.account || item.creator || '',
            video_link: item.url || item.video_link || "#",
            views: typeof item.views === 'number' ? item.views : parseInt(item.views || '0'),
            views_threshold: item.views_threshold || 1000,
            price_per_view: item.price_per_view || '0.001',
            total_to_pay: parseFloat(item.payout || item.total_to_pay || "0") || 0,
            status: numStatus,
            status_note: item.status_note || item.rejection_reason || "",
            date: item.created_at || new Date().toISOString().split("T")[0]
          };
        });
      } 
      
      // No filtrar videos por email
      setVideos(videosList);
      
      // Extraer las campañas únicas de los videos si no tenemos campañas de la API
      if ((!campaignsData.success || !campaignsData.campaigns || campaignsData.campaigns.length === 0) && videosList.length > 0) {
        const uniqueCampaigns = Array.from(new Set(videosList.map((video: Video) => video.campaign))) as string[];
        const campaignsFromVideos = uniqueCampaigns.map((campaignName: string, index) => ({
          id: index + 1,
          name: campaignName,
          description: `Descripción para ${campaignName}`,
          type: 'General',
          banner_image: `https://picsum.photos/800/300?random=${index + 1}`,
          profile_image: 'https://randomuser.me/api/portraits/men/1.jpg',
          total_budget: '5000.00',
          price_per_view: '0.002000',
          platforms: 'TikTok',
          budget_spent: '1000.00',
          created_at: new Date().toISOString(),
          admin_name: 'Administrador',
          admin_profile_image: 'https://randomuser.me/api/portraits/men/1.jpg',
          joined_at: new Date().toISOString(),
          budget_percentage: '20',
          is_joined: true
        }));
        
        setCampaigns(campaignsFromVideos);
      }

      // Calcular totales y balance
      let pendingVideos = 0;
      let approvedVideos = 0;
      let rejectedVideos = 0;
      let totalBalance = 0;

      // Contar videos por estado y calcular balance total
      videosList.forEach((video: Video) => {
        const viewThreshold = video.views_threshold || 1000;
        
        // Solo sumar al balance total si tiene suficientes vistas y está aprobado
        if (video.views >= viewThreshold && (video.status === 1 || video.status === 'approved')) {
          const amount = typeof video.total_to_pay === 'number' 
            ? video.total_to_pay 
            : parseFloat(video.payout || '0');
          totalBalance += amount;
        }

        // Contar videos por estado
        if (video.status === 0 || video.status === 'pending') pendingVideos++;
        else if (video.status === 1 || video.status === 'approved') approvedVideos++;
        else if (video.status === 2 || video.status === 'rejected') rejectedVideos++;
      });

      // Aplicar totales al estado del balance
      const balanceObj = {
        // Si la API proporciona valores, usarlos; de lo contrario, usar los calculados
        total: balanceData.balance?.total !== undefined ? balanceData.balance.total : totalBalance,
        pending_videos: balanceData.balance?.pending_videos !== undefined ? balanceData.balance.pending_videos : pendingVideos,
        approved_videos: balanceData.balance?.approved_videos !== undefined ? balanceData.balance.approved_videos : approvedVideos,
        rejected_videos: balanceData.balance?.rejected_videos !== undefined ? balanceData.balance.rejected_videos : rejectedVideos
      };

      // Si el total de la API es 0 o no está definido, usar el calculado
      if (!balanceObj.total || balanceObj.total === 0) {
        balanceObj.total = totalBalance;
      }

      setBalance(balanceObj);

      // Usar directamente los depósitos de la API
      if (balanceData.deposits && Array.isArray(balanceData.deposits)) {
        setDeposits(balanceData.deposits)
      }
    } catch (error: any) {
      setError(`No se pudieron cargar los datos: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

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
            onClick={fetchBalanceData}
            className="bg-red-700 hover:bg-red-600 text-white rounded px-3 py-1 text-sm"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }
    
    if (videos.length === 0) {
      return (
        <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded p-4 text-center">
          <p className="text-white mb-4">No hay videos disponibles para mostrar.</p>
        </div>
      );
    }

    return (
      <>
        {/* Mostrar videos individuales */}
        {campaigns.map((campaign) => {
          // Filtrar videos por campaña (por ID o por nombre si no hay ID)
          const campaignVideos = videos.filter(
            video => 
              video.campaign_id === campaign.id || 
              (video.campaign_id === null && video.campaign === campaign.name)
          );
          
          // Si la campaña no tiene videos, no la mostramos
          if (campaignVideos.length === 0) {
            return null;
          }
          
          return (
            <div key={`campaign-${campaign.id}`} className="mb-8">
              {/* Videos de la campaña */}
              <h4 className="text-white font-medium mb-3">Videos para esta campaña</h4>
              
              {/* Vista de escritorio */}
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
                    {campaignVideos.map((video, i) => renderVideoTableRow(video, i, false))}
                  </tbody>
                </table>
              </div>
              
              {/* Vista móvil */}
              <div className="md:hidden">
                {campaignVideos.map((video, i) => renderMobileVideoCard(video, i, false))}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // Renderizado de componentes
  const renderVideoTableRow = (video: Video, index: number, showCampaign = true) => {
    // Determinar estilos de estado
    let statusStyle = ""
    let statusText = ""
    let statusIcon = null

    // Asegurarse de que status sea un número para la comparación
    const numStatus = typeof video.status === 'string' 
      ? (video.status === 'approved' ? 1 : (video.status === 'rejected' ? 2 : 0)) 
      : video.status;

    // Estilos según el estado que viene directamente de la API
    if (numStatus === 0) {
      statusStyle = "bg-yellow-900/30 text-yellow-500 border border-yellow-700"
      statusText = "En proceso"
      statusIcon = <Clock size={16} className="mr-1" />
    } else if (numStatus === 1) {
      statusStyle = "bg-green-900/30 text-green-500 border border-green-700"
      statusText = "Aprobado"
      statusIcon = <Check size={16} className="mr-1" />
    } else if (numStatus === 2) {
      statusStyle = "bg-red-900/30 text-red-500 border border-red-700"
      statusText = "Rechazado"
      statusIcon = <X size={16} className="mr-1" />
    }

    // Verificar si el video cumple con el mínimo de vistas
    const viewThreshold = video.views_threshold || 10000;
    const hasSufficientViews = video.views >= viewThreshold;

    // Determinar estado de verificación de la cuenta
    const tikTokAccount = (video as any).tikTokAccount
    const accountVerificationStatus = tikTokAccount ? tikTokAccount.verification_status : null

    let accountStatusStyle = ""
    let accountStatusText = ""
    
    if (accountVerificationStatus === "verified") {
      accountStatusStyle = "bg-green-900/30 text-green-500 border border-green-700"
      accountStatusText = "Verificada"
    } else if (accountVerificationStatus === "rejected") {
      accountStatusStyle = "bg-red-900/30 text-red-500 border border-red-700"
      accountStatusText = "Rechazada"
    } else if (accountVerificationStatus === "pending") {
      accountStatusStyle = "bg-yellow-900/30 text-yellow-500 border border-yellow-700"
      accountStatusText = "Pendiente"
    }

    // Obtener el nombre de usuario a mostrar
    const creatorName = video.creator || video.account || '';

    // Obtener el enlace del video
    const videoLink = video.video_link || video.url || '#';

    // Calcular el total a pagar
    const totalToPay = typeof video.total_to_pay === 'number' 
      ? video.total_to_pay 
      : (video.payout ? parseFloat(video.payout) : 0);

    return (
      <tr key={`video-row-${index}`} className="border-b border-[#1c1c1c]">
        <td className="px-4 py-3 text-white">{video.campaign || "Sin campaña"}</td>
        <td className="px-4 py-3">
          <div className="flex flex-col">
            <span>{creatorName}</span>
            {accountVerificationStatus && (
              <span className={`mt-1 px-2 py-0.5 text-xs inline-block rounded ${accountStatusStyle}`}>
                {accountStatusText}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <a
            href={videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7c3aed] flex items-center hover:underline"
          >
            Ver video <ExternalLink size={16} className="ml-1" />
          </a>
        </td>
        <td className="px-4 py-3 text-right">
          <span className={video.views < viewThreshold ? "text-yellow-500" : ""}>
            {video.views.toLocaleString()}
          </span>
          {video.views < viewThreshold && (
            <span className="block text-xs text-yellow-500">Mínimo {viewThreshold.toLocaleString()} vistas</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <span className="font-medium">
            {hasSufficientViews ? `$${totalToPay.toFixed(2)}` : "$0.00"}
            {!hasSufficientViews && (
              <span className="block text-yellow-500 text-xs">* Pendiente de vistas</span>
            )}
          </span>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={numStatus === 2 ? () => handleVerificationToggle(video.id) : undefined}
            className={`px-3 py-1 rounded text-sm flex items-center
              ${statusStyle}
            `}
          >
            {statusIcon} {statusText}
          </button>
        </td>
      </tr>
    )
  }

  const renderMobileVideoCard = (video: Video, index: number, showCampaign = true) => {
    // Asegurarse de que status sea un número para la comparación
    const numStatus = typeof video.status === 'string' 
      ? (video.status === 'approved' ? 1 : (video.status === 'rejected' ? 2 : 0)) 
      : video.status;

    // Estilos según el estado que viene directamente de la API
    let statusStyle = ""
    let statusText = ""
    let statusIcon = null

    if (numStatus === 0) {
      statusStyle = "bg-yellow-900/30 text-yellow-500 border border-yellow-700"
      statusText = "En proceso"
      statusIcon = <Clock size={12} className="mr-1" />
    } else if (numStatus === 1) {
      statusStyle = "bg-green-900/30 text-green-500 border border-green-700"
      statusText = "Aprobado"
      statusIcon = <Check size={12} className="mr-1" />
    } else if (numStatus === 2) {
      statusStyle = "bg-red-900/30 text-red-500 border border-red-700"
      statusText = "Rechazado"
      statusIcon = <X size={12} className="mr-1" />
    }

    const viewThreshold = video.views_threshold || 1000;
    const hasSufficientViews = video.views >= viewThreshold;

    // Determinar estado de verificación de la cuenta
    const tikTokAccount = (video as any).tikTokAccount
    const accountVerificationStatus = tikTokAccount ? tikTokAccount.verification_status : null

    let accountStatusStyle = ""
    let accountStatusText = ""
    
    if (accountVerificationStatus === "verified") {
      accountStatusStyle = "bg-green-900/30 text-green-500 border border-green-700"
      accountStatusText = "Cuenta verificada"
    } else if (accountVerificationStatus === "rejected") {
      accountStatusStyle = "bg-red-900/30 text-red-500 border border-red-700"
      accountStatusText = "Cuenta rechazada"
    } else if (accountVerificationStatus === "pending") {
      accountStatusStyle = "bg-yellow-900/30 text-yellow-500 border border-yellow-700"
      accountStatusText = "Cuenta pendiente"
    }

    // Obtener el nombre de usuario a mostrar
    const creatorName = video.creator || video.account || '';

    // Obtener el enlace del video
    const videoLink = video.video_link || video.url || '#';

    // Calcular el total a pagar
    const totalToPay = typeof video.total_to_pay === 'number' 
      ? video.total_to_pay 
      : (video.payout ? parseFloat(video.payout) : 0);

    return (
      <div
        key={`video-mobile-${index}`}
        className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-md p-3 mb-3"
      >
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">Campaña:</p>
            <p className="text-white">{video.campaign}</p>
          </div>
          <div>
            <p className="text-gray-500">Creador:</p>
            <p className="text-white">{creatorName}</p>
            {accountVerificationStatus && (
              <span className={`mt-1 px-2 py-0.5 text-xs inline-block rounded ${accountStatusStyle}`}>
                {accountStatusText}
              </span>
            )}
          </div>
          <div>
            <p className="text-gray-500">Vistas:</p>
            <p className={`${!hasSufficientViews ? "text-yellow-500" : "text-white"}`}>
              {video.views.toLocaleString()}
              {!hasSufficientViews && <span className="block text-xs">Mínimo {viewThreshold.toLocaleString()} vistas</span>}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Total a pagar:</p>
            <p className="text-white font-medium">
              {hasSufficientViews ? `$${totalToPay.toFixed(2)}` : "$0.00"}
              {!hasSufficientViews && <span className="block text-yellow-500 text-xs">Pendiente de vistas</span>}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Estado:</p>
            <button
              onClick={numStatus === 2 ? () => handleVerificationToggle(video.id) : undefined}
              className={`px-2 py-1 rounded text-xs flex items-center ${statusStyle}`}
            >
              {statusIcon} {statusText}
            </button>
          </div>
          <div className="col-span-2 mt-2">
            <a
              href={videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7c3aed] flex items-center text-sm hover:underline"
            >
              Ver video <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
        </div>
      </div>
    )
  }

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
            onClick={fetchBalanceData}
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
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === "depositos"
                  ? "text-white border-b-2 border-[#7c3aed]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("depositos")}
            >
              Depósitos ({deposits.length})
            </button>
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
