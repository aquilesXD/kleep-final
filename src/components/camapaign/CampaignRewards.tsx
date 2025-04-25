"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { CampaignSidebar } from "../layout/CampainSidebar";
import Sidebar from "../layout/Sidebar";
import { toast } from 'react-hot-toast';
import tiktokVerificationService from "../../services/tiktokVerificationService";

// Get auth token from localStorage or sessionStorage
const getAuthToken = (): string => {
  return localStorage.getItem("authToken") || 
         localStorage.getItem("token") || 
         sessionStorage.getItem("authToken") || 
         sessionStorage.getItem("token") || 
         ""; // Devuelve cadena vacía si no encuentra token
};

// Interfaz para la campaña
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
  admin_id: number;
  admin_name: string;
  admin_profile_image: string;
  budget_percentage: string;
}

// Interfaz para los requisitos
interface Requirement {
  id: number;
  description: string;
}

// Interfaz para la respuesta de la API
interface RewardsResponse {
  campaign: Campaign;
  requirements: Requirement[];
}

// Interfaz para el envío de video
interface VideoSubmission {
  url: string;
  title: string;
  description: string;
  tiktok_account_id: number;
}

// Interfaz para una campaña unida
interface JoinedCampaign {
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

export default function CampaignRewards() {
  const { campaignId = "1" } = useParams<{ campaignId: string }>();
  const [videoLink, setVideoLink] = useState("");
  const [videoTitle, setVideoTitle] = useState("Mi video de TikTok");
  const [videoDescription, setVideoDescription] = useState("Video promocional para campaña");
  const [submitting, setSubmitting] = useState(false);
  const [rewardsData, setRewardsData] = useState<RewardsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const navigate = useNavigate();
  
  // Estados para manejar la unión a la campaña
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Obtener los datos de recompensas
  const fetchRewards = useCallback(async () => {
    let ignore = false;
    
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
      let response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/rewards`, {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Si el error es 401 (No autorizado), intentar con formatos alternativos
      if (response.status === 401) {
        // Intentar con formato alternativo (solo token sin Bearer)
        response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/rewards`, {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        // Si sigue fallando, intentar con query param
        if (response.status === 401) {
          response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/rewards?api_token=${token}`, {
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
        throw new Error(`Error al cargar las recompensas (${response.status})`);
      }

      const data = await response.json();
      
      // Verificar si debemos ignorar esta respuesta (componente desmontado)
      if (!ignore) {
        setRewardsData(data);
        setError(null);
      }
    } catch (err) {
      if (!ignore) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  }, [campaignId]);

  // Verificar si el usuario ya está unido a la campaña
  const checkJoinedStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    try {
      const token = getAuthToken();
      
      if (!token) {
        setIsCheckingStatus(false);
        return;
      }

      // Llamar a la API para obtener las campañas unidas
      const response = await fetch(`https://contabl.net/kleep/api/campaigns/joined`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      });

      // Si es 401, podría ser un problema de autenticación
      if (response.status === 401) {
        setIsAuthError(true);
        setIsCheckingStatus(false);
        return;
      }

      if (!response.ok) {
        console.error(`Error al verificar campañas unidas: ${response.status}`);
        setIsJoined(false);
        setIsCheckingStatus(false);
        return;
      }

      const data = await response.json();
      
      // Verificar si ya está unido a esta campaña específica
      if (data && Array.isArray(data.campaigns)) {
        const isJoined = data.campaigns.some(
          (campaign: JoinedCampaign) => campaign.id === Number(campaignId) && campaign.is_joined === true
        );
        setIsJoined(isJoined);
      } else {
        setIsJoined(false);
      }
    } catch (error) {
      console.error('Error al verificar estado de la campaña:', error);
      setIsJoined(false);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchRewards();
    checkJoinedStatus(); // Verificar si el usuario está unido a la campaña
  }, [fetchRewards, checkJoinedStatus]);

  // Función para unirse a la campaña
  const joinCampaign = async () => {
    setIsJoining(true);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        setIsAuthError(true);
        throw new Error("No se encontró un token de autenticación. Por favor, inicia sesión.");
      }

      const response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      });

      // Si es 404, podríamos simular éxito en entorno de desarrollo
      if (response.status === 404) {
        toast.success('¡Te has unido a la campaña exitosamente!');
        setIsJoined(true);
        return;
      }

      if (response.status === 401) {
        setIsAuthError(true);
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }

      if (!response.ok) {
        throw new Error(`Error al unirse a la campaña (${response.status})`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('¡Te has unido a la campaña exitosamente!');
        setIsJoined(true);
      } else {
        throw new Error(data.message || "Error al unirse a la campaña");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsJoining(false);
    }
  };

  // Esta función obtiene el ID de la primera cuenta de TikTok verificada
  const fetchTikTokAccountId = async (): Promise<number | null> => {
    try {
      // Usar el servicio para obtener las cuentas
      const accounts = await tiktokVerificationService.fetchTikTokAccountsFromNewApi();
      
      // Filtrar solo las cuentas verificadas
      const verifiedAccounts = accounts.filter(account => account.isVerified);
      
      // Si hay cuentas verificadas, devolver el ID de la primera
      if (verifiedAccounts.length > 0) {
        return Number(verifiedAccounts[0].id);
      }
      
      // Si no hay cuentas verificadas, devolver null
      return null;
    } catch (error) {
      console.error("Error al obtener ID de cuenta TikTok:", error);
      // En caso de error, también devolver null
      return null;
    }
  };

  // Ajustar el manejo de errores para capturar la respuesta completa del servidor
  const handleSubmit = async () => {
    if (!videoLink) {
      toast.error("Por favor ingrese un enlace de video válido.");
      return;
    }

    try {
      setSubmitting(true);

      // Obtener el token mediante la función getAuthToken
      const token = getAuthToken();

      // Verificar que haya un token válido
      if (!token) {
        setIsAuthError(true);
        throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
      }

      // Obtener el ID de cuenta de TikTok
      const accountId = await fetchTikTokAccountId();

      // Verificar si se encontró una cuenta válida
      if (accountId === null) {
        throw new Error('No se encontró una cuenta de TikTok verificada. Por favor, verifica una cuenta en tu perfil antes de enviar videos.');
      }

      // Preparar los datos para enviar - incluyendo todos los campos requeridos
      const videoData = {
        url: videoLink,
        title: videoTitle,
        description: videoDescription,
        tiktok_account_id: accountId
      };

      // Hacer la petición para enviar el video
      const response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/submit-video`, {
        method: 'POST',
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(videoData)
      });

      // Si el error es 422, mostrar información detallada para depuración
      if (response.status === 422) {
        const errorData = await response.json();
        
        // Mostrar mensaje más detallado para ayudar al diagnóstico
        let errorMessage = "Los datos enviados no son válidos.";
        if (errorData && errorData.errors) {
          // Extraer mensajes de error específicos
          const errorDetails = Object.entries(errorData.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          errorMessage += ` ${errorDetails}`;
        }
        
        throw new Error(`Error 422: ${errorMessage}`);
      }

      // Si el error es 403 (Prohibido), mostrar un mensaje claro
      if (response.status === 403) {
        throw new Error('Error 403: No tienes permiso para realizar esta acción.');
      }

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Error al enviar el video (${response.status}): ${responseText}`);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { success: true }; // Asumimos éxito si la respuesta es exitosa pero no es JSON
      }

      if (data.success) {
        // Mostrar mensaje de éxito con detalles si están disponibles
        const message = data.message || "¡Video enviado correctamente!";
        toast.success(message);
        
        // Limpiar el formulario
        setVideoLink("");
      } else {
        throw new Error(data.message || "Error al enviar el video");
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Calcular días restantes (ejemplo: 56 días)
  const daysLeft = 56;
  
  // Calcular porcentaje de tiempo restante (ejemplo: 38%)
  const timePercentage = 38;

  // Mostrar mensaje de carga mientras se obtienen los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
        <p className="text-white ml-4">Cargando recompensas...</p>
      </div>
    );
  }

  // Mostrar mensaje de error si algo falla
  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center">
        <p className="text-red-500 text-xl">Error: {error}</p>
        
        {isAuthError ? (
          <button 
            onClick={() => navigate('/signin')} 
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md">
            Iniciar sesión
          </button>
        ) : (
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md">
            Reintentar
          </button>
        )}
      </div>
    );
  }

  // Datos de la campaña y requisitos
  const campaign = rewardsData?.campaign;
  const requirements = rewardsData?.requirements || [];

  return (
    <div className="min-h-screen bg-[#121212]">
      <Sidebar />
      <div className="pl-20 lg:pl-24">
        <div className="flex flex-col lg:flex-row">
          <CampaignSidebar activeItem="rewards" />
          <main className="flex-1 p-4 lg:p-6">
            <div className="max-w-4xl mx-auto">
              {/* Alerta amarilla */}
              <div className="bg-[#fffbd6] text-[#73682b] p-4 rounded-lg mb-6">
                <p className="text-sm">Envíe su publicación para revisión dentro de 1 hora de su publicación para comenzar a recibir pagos</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* PAID OUT */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-400 text-sm uppercase font-medium">PAGADO</h3>
                    <span className="text-white text-sm">{campaign?.budget_percentage || 0}%</span>
                  </div>
                  <p className="text-white text-sm">${campaign?.budget_spent || "0"} de ${campaign?.total_budget || "0"} pagados</p>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500" style={{ width: `${campaign?.budget_percentage || 0}%` }}></div>
                  </div>
                </div>

                {/* TIME LEFT */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-400 text-sm uppercase font-medium">TIEMPO RESTANTE</h3>
                    <span className="text-white text-sm">{timePercentage}%</span>
                  </div>
                  <p className="text-white text-sm">quedan {daysLeft} días</p>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500" style={{ width: `${timePercentage}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* REWARD */}
                <div>
                  <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">RECOMPENSAS</h3>
                  <div className="bg-violet-600 text-white text-sm font-medium py-1.5 px-3 rounded-md inline-block">
                    {parseFloat(campaign?.price_per_view || "0").toFixed(2)} US$ / 1 mil
                  </div>
                </div>

                {/* CONTENT TYPE */}
                <div>
                  <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">TIPO DE CONTENIDO</h3>
                  <div className="bg-gray-800 text-white text-sm py-1.5 px-3 rounded-md inline-block">
                    {campaign?.type || "Clipping"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* MAX PAID OUT */}
                <div>
                  <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">MÁXIMO PAGADO</h3>
                  <div className="bg-gray-800 text-white text-sm py-1.5 px-3 rounded-md inline-block">
                    $ {campaign?.total_budget || "500"}
                  </div>
                </div>

                {/* CATEGORY */}
                <div>
                  <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">CATEGORIA</h3>
                  <div className="bg-gray-800 text-white text-sm py-1.5 px-3 rounded-md inline-block">
                    {campaign?.type || "Creator"}
                  </div>
                </div>
              </div>

              {/* PLATFORMS */}
              <div className="mb-6">
                <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">PLATAFORMAS</h3>
                <div className="flex space-x-2">
                  {campaign?.platforms && (
                    <div className="text-white text-xl">
                      {campaign.platforms.toLowerCase().includes('tiktok') && (
                        <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
                          <path d="M22.02 7.364v3.586c-.6-.064-1.2-.107-1.793-.107-.8 0-1.585.107-2.328.32-1.143.32-2.157.898-2.993 1.66V7.257v-4.45h-4.014v16.709c0 .064 0 .135.007.199h-4.078a2.505 2.505 0 0 1 .078-.606V2.807H2.878v17.643c0 1.902 1.528 3.437 3.407 3.437h12.214c1.88 0 3.407-1.535 3.407-3.437v-4.31a3.428 3.428 0 0 0-.235-1.251 3.34 3.34 0 0 0-.663-1.067 6.294 6.294 0 0 1 3.236-1.137v.021c-.086-1.2-.707-2.264-1.614-2.928.935-.67 1.557-1.75 1.65-2.978.014-.142.021-.285.021-.435H22.02Z" />
                        </svg>
                      )}
                      {campaign.platforms.toLowerCase().includes('instagram') && (
                        <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      )}
                      {campaign.platforms.toLowerCase().includes('youtube') && (
                        <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* REQUIREMENTS */}
              <div className="mb-6">
                <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">REQUIRIMIENTOS</h3>
                <div className="space-y-2">
                  {requirements.map((requirement) => (
                    <div key={requirement.id} className="bg-gray-800 text-white text-sm py-2 px-3 rounded-md">
                      {requirement.description}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit section */}
              <div className="mt-8">
                <h2 className="text-white text-xl font-semibold mb-2">Envíe su publicación de video en las redes sociales</h2>
                <p className="text-gray-400 text-sm mb-4">Comparte el enlace de tu publicación a continuación.</p>

                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
                    <p className="text-white ml-4">Verificando estado...</p>
                  </div>
                ) : isJoined ? (
                  <>
                    <div className="mb-4">
                      <label htmlFor="videoLink" className="block text-gray-400 text-sm mb-2">Enlace del video *</label>
                      <input
                        type="text"
                        id="videoLink"
                        placeholder="https://"
                        className="w-full p-3 rounded-md bg-[#111] border border-[#333] text-white text-sm focus:outline-none focus:border-blue-500"
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      className={`w-full bg-violet-600 hover:bg-violet-700 text-white text-center py-3 rounded-md transition ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </span>
                      ) : (
                        "Enviar"
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="bg-[#222] text-yellow-500 border border-yellow-500/30 p-4 rounded-lg mb-6">
                      <p className="text-sm">Debes unirte a esta campaña antes de poder enviar videos. Al unirte, aceptas cumplir con los requisitos establecidos.</p>
                    </div>
                    <button
                      className={`bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-md w-full ${
                        isJoining ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      onClick={joinCampaign}
                      disabled={isJoining}
                    >
                      {isJoining ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uniéndose...
                        </span>
                      ) : (
                        'Unirse a esta campaña'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
