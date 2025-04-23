"use client"

import { useState, useEffect, useCallback } from "react"
import { ExternalLink, Check, Clock, AlertTriangle, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

// API endpoints
const API_BASE_URL = "https://contabl.net/kleep/api"
const BALANCE_ENDPOINT = `${API_BASE_URL}/balance`
const VIDEOS_ENDPOINT = `${API_BASE_URL}/videos`
const TIKTOK_ACCOUNTS_ENDPOINT = `${API_BASE_URL}/tiktok-accounts`
const TIKTOK_UNVERIFIED_ACCOUNTS_ENDPOINT = `${API_BASE_URL}/tiktok-accounts/unverified`

// Tipos simplificados
interface Video {
  id: string
  title: string
  campaign: string
  creator: string
  video_link: string
  views: number
  total_to_pay: number
  status: number // 0: En proceso, 1: Aprobado, 2: Rechazado
  status_note: string
  date: string
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

const ProfileBalance = () => {
  // Estados principales
  const [email, setEmail] = useState<string | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
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
  const [tiktokAccounts, setTiktokAccounts] = useState<TikTokAccount[]>([])
  const [unverifiedAccounts, setUnverifiedAccounts] = useState<TikTokAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [loadingUnverifiedAccounts, setLoadingUnverifiedAccounts] = useState(false)
  const [accountsError, setAccountsError] = useState<string | null>(null)
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
    fetchTikTokAccounts() 
    fetchUnverifiedTikTokAccounts() // Cargar cuentas no verificadas
  }, [navigate])

  // Función para obtener cuentas de TikTok
  const fetchTikTokAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    setAccountsError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No se encontró el token de autenticación')
      }

      // Hacer la petición a la API de cuentas de TikTok
      const response = await axios.get<{success: boolean, accounts: TikTokAccount[]}>(
        TIKTOK_ACCOUNTS_ENDPOINT,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success && Array.isArray(response.data.accounts)) {
        setTiktokAccounts(response.data.accounts)
        
        // Actualiza el estado de los videos con la información de las cuentas asociadas
        if (videos.length > 0) {
          const updatedVideos = videos.map(video => {
            // Busca si hay una cuenta de TikTok con el mismo username que creator
            const associatedAccount = response.data.accounts.find(
              account => video.creator.toLowerCase() === account.username.toLowerCase() ||
                         video.creator.toLowerCase() === '@' + account.username.toLowerCase()
            );
            
            // Si encuentra una cuenta asociada, agrega la información al objeto de video
            if (associatedAccount) {
              return {
                ...video,
                tikTokAccount: associatedAccount,
                hasVerifiedAccount: associatedAccount.verification_status === 'verified'
              };
            }
            
            return video;
          });
          
          setVideos(updatedVideos);
        }
      } else {
        // Si no hay cuentas o la respuesta no es exitosa, inicializar con un array vacío
        setTiktokAccounts([])
      }
    } catch (error) {
      console.error('Error al obtener cuentas de TikTok:', error)
      setAccountsError('No se pudieron cargar las cuentas de TikTok')
    } finally {
      setLoadingAccounts(false)
    }
  }, [videos])

  // Función para obtener cuentas no verificadas de TikTok
  const fetchUnverifiedTikTokAccounts = useCallback(async () => {
    setLoadingUnverifiedAccounts(true)
    setUnverifiedAccountsError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No se encontró el token de autenticación')
      }

      // Hacer la petición a la API de cuentas no verificadas
      const response = await axios.get<{success: boolean, accounts: TikTokAccount[]}>(
        TIKTOK_UNVERIFIED_ACCOUNTS_ENDPOINT,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success && Array.isArray(response.data.accounts)) {
        setUnverifiedAccounts(response.data.accounts)
        // Ya no establecemos showTiktokVerificationSection basado en la respuesta
      } else {
        // Si no hay cuentas o la respuesta no es exitosa, inicializar con un array vacío
        setUnverifiedAccounts([])
      }
    } catch (error) {
      console.error('Error al obtener cuentas de TikTok no verificadas:', error)
      setUnverifiedAccountsError('No se pudieron cargar las cuentas de TikTok no verificadas')
    } finally {
      setLoadingUnverifiedAccounts(false)
    }
  }, [])

  // Función principal para obtener datos de la API
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
      console.log('Balance API Response:', balanceData)

      if (!balanceData.success) {
        throw new Error('La respuesta de la API de balance no indica éxito')
      }

      // Obtener datos específicos de videos desde la API dedicada
      const videosResponse = await fetch(VIDEOS_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!videosResponse.ok) {
        throw new Error(`Error al obtener videos: ${videosResponse.status}`)
      }

      // Parsear respuesta JSON de videos
      const videosData = await videosResponse.json()
      console.log('Videos API Response:', videosData)

      let videosList = [];
      
      // Procesar videos manteniendo los estados según vienen de la API dedicada
      if (videosData.success && videosData.videos && Array.isArray(videosData.videos) && videosData.videos.length > 0) {
        videosList = videosData.videos.map((item: any, index: number) => ({
          id: item.id || `video-${index}`,
          title: item.title || `Vídeo ${index + 1}`,
          campaign: item.campaign || "Campaña estándar",
          creator: item.creator || item.tiktok_username || "N/A",
          video_link: item.video_link || "#",
          views: item.views || 0,
          total_to_pay: parseFloat(item.total_to_pay || item.amount || "0") || 0,
          status: item.status !== undefined ? Number(item.status) : 0,
          status_note: item.status_note || item.rejection_reason || "",
          date: item.created_at || new Date().toISOString().split("T")[0]
        }));
      } else if (balanceData.videos && Array.isArray(balanceData.videos) && balanceData.videos.length > 0) {
        // Usar videos de la API de balance como respaldo si la API dedicada no devuelve videos
        videosList = balanceData.videos.map((item: any, index: number) => ({
          id: item.id || `video-${index}`,
          title: item.title || `Vídeo ${index + 1}`,
          campaign: item.campaign || "Campaña estándar",
          creator: item.creator || item.tiktok_username || "N/A",
          video_link: item.video_link || "#",
          views: item.views || 0,
          total_to_pay: parseFloat(item.total_to_pay || item.amount || "0") || 0,
          status: item.status !== undefined ? Number(item.status) : 0,
          status_note: item.status_note || item.rejection_reason || "",
          date: item.created_at || new Date().toISOString().split("T")[0]
        }));
      } 
      
      // Si no hay videos en ninguna de las APIs, usar datos de ejemplo para mostrar la funcionalidad
      if (videosList.length === 0) {
        console.log('No se encontraron videos, mostrando datos de ejemplo');
        videosList = [
          {
            id: 'video-example-1',
            title: 'Video de ejemplo 1',
            campaign: 'Campaña de demostración',
            creator: 'usuario_tiktok1',
            video_link: 'https://www.tiktok.com/example1',
            views: 1500, // Menos de 2000 vistas
            total_to_pay: 15.75,
            status: 0, // En proceso
            status_note: '',
            date: new Date().toISOString().split("T")[0]
          },
          {
            id: 'video-example-2',
            title: 'Video de ejemplo 2',
            campaign: 'Campaña de demostración',
            creator: 'usuario_tiktok2',
            video_link: 'https://www.tiktok.com/example2',
            views: 3500, // Más de 2000 vistas
            total_to_pay: 35.50,
            status: 1, // Aprobado
            status_note: '',
            date: new Date().toISOString().split("T")[0]
          },
          {
            id: 'video-example-3',
            title: 'Video de ejemplo 3',
            campaign: 'Campaña de demostración',
            creator: 'usuario_tiktok3',
            video_link: 'https://www.tiktok.com/example3',
            views: 2100, // Más de 2000 vistas
            total_to_pay: 21.25,
            status: 2, // Rechazado
            status_note: 'El contenido no cumple con las normas de la campaña',
            date: new Date().toISOString().split("T")[0]
          }
        ];
      }
      
      // Actualizar el estado con la lista de videos procesada
      setVideos(videosList);

      // Calcular totales y balance
      let pendingVideos = 0;
      let approvedVideos = 0;
      let rejectedVideos = 0;
      let totalBalance = 0;

      // Contar videos por estado y calcular balance total
      videosList.forEach((video: Video) => {
        // Solo sumar al balance total si tiene suficientes vistas y está aprobado
        if (video.views >= 2000 && video.status === 1) {
          totalBalance += video.total_to_pay;
        }

        // Contar videos por estado
        if (video.status === 0) pendingVideos++;
        else if (video.status === 1) approvedVideos++;
        else if (video.status === 2) rejectedVideos++;
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

      console.log('Balance calculado:', balanceObj);
      setBalance(balanceObj);

      // Usar directamente los depósitos de la API
      if (balanceData.deposits && Array.isArray(balanceData.deposits)) {
        setDeposits(balanceData.deposits)
      }
    } catch (error: any) {
      console.error('Error:', error)
      setError(`No se pudieron cargar los datos: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Manejadores de eventos
  const handleShowRejectionModal = (videoId: string) => {
    const video = videos.find(v => v.id === videoId)
    if (video) {
      setSelectedVideo(video)
      setShowRejectionModal(true)
    }
  }

  const handleCloseRejectionModal = () => {
    setShowRejectionModal(false)
    setSelectedVideo(null)
  }

  const handleVerificationToggle = (videoId: string) => {
    const video = videos.find(v => v.id === videoId)
    if (!video) return
    
    if (video.status === 2) {
      handleShowRejectionModal(video.id)
    }
  }

  const handleNavigateToAccountsVerification = () => {
    navigate("/profile-cuentas")
  }

  // Renderizado de componentes
  const renderVideoTableRow = (video: Video, index: number) => {
    // Determinar estilos de estado
    let statusStyle = ""
    let statusText = ""
    let statusIcon = null

    // Estilos según el estado que viene directamente de la API
    if (video.status === 0) {
      statusStyle = "bg-yellow-900/30 text-yellow-500 border border-yellow-700"
      statusText = "En proceso"
      statusIcon = <Clock size={16} className="mr-1" />
    } else if (video.status === 1) {
      statusStyle = "bg-green-900/30 text-green-500 border border-green-700"
      statusText = "Aprobado"
      statusIcon = <Check size={16} className="mr-1" />
    } else if (video.status === 2) {
      statusStyle = "bg-red-900/30 text-red-500 border border-red-700"
      statusText = "Rechazado"
      statusIcon = <X size={16} className="mr-1" />
    }

    // Verificar si el video cumple con el mínimo de vistas
    const hasSufficientViews = video.views >= 2000

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

    return (
      <tr key={`video-row-${index}`} className="border-b border-[#1c1c1c]">
        <td className="px-4 py-3">{video.campaign}</td>
        <td className="px-4 py-3">
          <div className="flex flex-col">
            <span>{video.creator}</span>
            {accountVerificationStatus && (
              <span className={`mt-1 px-2 py-0.5 text-xs inline-block rounded ${accountStatusStyle}`}>
                {accountStatusText}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <a
            href={video.video_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7c3aed] flex items-center hover:underline"
          >
            Ver video <ExternalLink size={16} className="ml-1" />
          </a>
        </td>
        <td className="px-4 py-3 text-right">
          <span className={video.views < 2000 ? "text-yellow-500" : ""}>
            {video.views.toLocaleString()}
          </span>
          {video.views < 2000 && (
            <span className="block text-xs text-yellow-500">Mínimo 2000 vistas</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <span className="font-medium">
            {hasSufficientViews ? video.total_to_pay.toFixed(2) : "$0.00"}
            {!hasSufficientViews && (
              <span className="block text-yellow-500 text-xs">* Pendiente de vistas</span>
            )}
          </span>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={video.status === 2 ? () => handleVerificationToggle(video.id) : undefined}
            className={`px-3 py-1 rounded text-sm flex items-center
              ${statusStyle}
              ${video.status !== 2 ? "cursor-default" : "hover:opacity-90 cursor-pointer"}`}
          >
            {statusIcon} {statusText}
          </button>
        </td>
      </tr>
    )
  }

  const renderMobileVideoCard = (video: Video, index: number) => {
    // Estilos según el estado que viene directamente de la API
    let statusStyle = ""
    let statusText = ""
    let statusIcon = null

    if (video.status === 0) {
      statusStyle = "bg-yellow-900/30 text-yellow-500 border border-yellow-700"
      statusText = "En proceso"
      statusIcon = <Clock size={12} className="mr-1" />
    } else if (video.status === 1) {
      statusStyle = "bg-green-900/30 text-green-500 border border-green-700"
      statusText = "Aprobado"
      statusIcon = <Check size={12} className="mr-1" />
    } else if (video.status === 2) {
      statusStyle = "bg-red-900/30 text-red-500 border border-red-700"
      statusText = "Rechazado"
      statusIcon = <X size={12} className="mr-1" />
    }

    const hasSufficientViews = video.views >= 2000

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
            <p className="text-white">{video.creator}</p>
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
              {!hasSufficientViews && <span className="block text-xs">Mínimo 2000 vistas</span>}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Total a pagar:</p>
            <p className="text-white font-medium">
              {hasSufficientViews ? video.total_to_pay.toFixed(2) : "$0.00"}
              {!hasSufficientViews && <span className="block text-yellow-500 text-xs">Pendiente de vistas</span>}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Estado:</p>
            <button
              onClick={() => handleVerificationToggle(video.id)}
              className={`px-2 py-1 rounded text-xs flex items-center ${statusStyle}`}
            >
              {statusIcon} {statusText}
            </button>
          </div>
          <div className="col-span-2 mt-2">
            <a
              href={video.video_link}
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
          {/* Vista de escritorio */}
          <div className="hidden md:block bg-[#0c0c0c] border border-[#1c1c1c] rounded">
            <table className="w-full">
              <thead className="border-b border-[#1c1c1c] text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">CAMPAÑA</th>
                  <th className="px-4 py-3 text-left">CUENTAS</th>
                  <th className="px-4 py-3 text-left">VIDEO</th>
                  <th className="px-4 py-3 text-right">VISTAS</th>
                  <th className="px-4 py-3 text-right">TOTAL A PAGAR</th>
                  <th className="px-4 py-3 text-left">ESTADO</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {videos.length > 0 ? (
                  videos.map((video, i) => renderVideoTableRow(video, i))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center">
                      No hay videos disponibles para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Vista móvil */}
          <div className="md:hidden">
            {videos.length > 0 ? (
              videos.map((video, i) => renderMobileVideoCard(video, i))
            ) : (
              <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded p-4 text-center text-white">
                No hay videos disponibles para mostrar.
              </div>
            )}
          </div>

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
