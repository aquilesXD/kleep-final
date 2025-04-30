import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { WaitlistFormModal } from './WaitlistFormModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
// Asegúrate de importar getAuthToken si no está ya en este archivo
import { getAuthToken } from '../../services/authService'; // <-- Asegúrate que esta importación sea correcta

interface WhopCreatorsModalProps {
  onClose: () => void;
  reward: {
    id: number; // <-- El ID de la campaña está aquí
    avatar: string;
    creator: string;
    title: string;
    paidAmount: string;
    totalAmount: string;
    percentage: number;
    type: string;
    platform: string;
    rate: string;
    specialStyle?: boolean;
    image?: string;
    banner_image?: string;
    profile_image?: string;
  };
}

// (Interfaz JoinedCampaign y getAuthToken - asumimos que están bien)

const WhopCreatorsModal = ({ onClose, reward }: WhopCreatorsModalProps) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isAlreadyJoined, setIsAlreadyJoined] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const imageUrl = reward?.image ?? reward.banner_image ?? reward.avatar ?? 'https://picsum.photos/800/300?random=1'; // Mejorar fallback
  const navigate = useNavigate();

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const userEmail = localStorage.getItem("userEmail");
    const isAuth = Boolean(authStatus && userEmail);
    setIsAuthenticated(isAuth);
    
    // Si está autenticado, verificar si ya está unido a la campaña
    if (isAuth) {
      checkJoinedStatus();
    } else {
      setIsCheckingStatus(false);
    }
  // Añadir dependencias al useEffect
  }, [isAuthenticated, reward.id]); // <-- Añadir reward.id aquí también es buena práctica
  
  // Verificar si el usuario ya está unido a la campaña usando la API específica
  // (Mantienes esta lógica tal cual, parece correcta para su propósito)
  const checkJoinedStatus = async () => {
    // ... (tu código actual de checkJoinedStatus) ...
    setIsCheckingStatus(true);
    try {
      const token = getAuthToken();
      
      if (!token) {
        setIsCheckingStatus(false);
        return;
      }

      // Llamar a la API correcta para obtener las campañas unidas
      // NOTA: Esta API obtiene *todas* las campañas unidas, no una específica.
      // La verificación del estado de unión se hace correctamente en la lógica subsiguiente.
      const response = await fetch(`https://contabl.net/kleep/api/campaigns/joined`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      });

      // Si es 404 o cualquier error, asumimos que no está unido
      if (response.status === 401) {
        handle401Error();
        return;
      }

      if (!response.ok) {
        console.error(`Error al verificar campañas unidas: ${response.status}`);
        setIsAlreadyJoined(false);
        setIsCheckingStatus(false);
        return;
      }

      const data = await response.json();
      
      // Verificar si ya está unido a esta campaña específica según el formato correcto
      if (data && Array.isArray(data.campaigns)) {
        const isJoined = data.campaigns.some(
          // Aquí buscas el ID de la campaña actual (reward.id) dentro de la lista de unidas
          (campaign: { id: number; is_joined?: boolean }) => campaign.id === reward.id // && campaign.is_joined === true // is_joined en el objeto de la lista de joined parece redundante o podría ser false si se unió y luego se "desunió" lógicamente en el backend, pero la comparación por ID ya es suficiente para saber si está en la lista.
        );
        setIsAlreadyJoined(isJoined);
      } else {
         // Manejar caso donde la respuesta no es un array o tiene formato inesperado
         console.warn("Respuesta de campañas unidas inesperada:", data);
         setIsAlreadyJoined(false);
      }
    } catch (error) {
      console.error('Error al verificar estado de la campaña:', error);
      setIsAlreadyJoined(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  // *** MODIFICACIÓN AQUÍ ***
  const handleViewDetails = () => {
    onClose(); // Cierra el modal
    const targetPath = `/campaign/${reward.id}`;
    navigate(targetPath);
  };
  
  // *** MODIFICACIÓN AQUÍ ***
  // Es la misma lógica que handleViewDetails, podrías incluso usar la misma función
  const handleViewCampaign = () => {
    onClose(); // Cierra el modal
    const targetPath = `/campaign/${reward.id}`;
    navigate(targetPath);
  };

  // Function to handle 401 unauthorized errors
  const handle401Error = () => {
    toast.error("Sesión expirada. Por favor inicia sesión nuevamente.");
    
    // Redirect to login after a short delay
    setTimeout(() => {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("authToken"); // Asegúrate de limpiar también el token
      localStorage.removeItem("token");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("token");
      
      // Guarda el ID de la campaña para redirigir después del login, si es necesario
      localStorage.setItem('pendingCampaignId', reward.id.toString()); // Cambiado a pendingCampaignId para mayor claridad
      
      navigate('/signin');
    }, 1500);
  };

  // getAuthToken (Mantienes esta función si está definida aquí o la importas)
  // ... (tu función getAuthToken) ...
  // Si ya la tienes importada arriba, puedes omitir esta re-declaración.

  const joinCampaign = async () => {
    // ... (tu código actual de joinCampaign) ...
    setIsJoining(true);
    setJoinError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`https://contabl.net/kleep/api/campaigns/${reward.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      });

      // Si la respuesta es 200 OK con éxito en el body, o si es 404 (simulando éxito)
      if (response.ok) {
         const data = await response.json();
         if (data.success || response.status === 200) { // Considerar 200 OK como éxito si success no está siempre presente
            toast.success('¡Te has unido a la campaña exitosamente!');
            setIsAlreadyJoined(true);
            onClose();
            // Redirigir al dashboard de campañas unidas o a la página de detalles de ESTA campaña
            // navigate('/dashboard/campaigns'); // o si quieres ir a la página de detalles de la campaña unida:
            const targetPath = `/campaigns/${reward.id}/rewards`;
            navigate(targetPath);
            return; // Salir de la función después del éxito
         } else {
             // Si response.ok pero success es false
             throw new Error(data.message || 'Error al unirse a la campaña');
         }
      }
      
      // Manejo específico para 401
      if (response.status === 401) {
        handle401Error();
        return;
      }

      // Manejo de otros errores HTTP (incluido 404 si no lo tratas como éxito simulado)
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText || 'Unknown error'}`);

    } catch (error: any) {
      console.error('Error joining campaign:', error);
      
      // Si el error es un error de red o parseo, o un error 401 que no fue manejado arriba
      if (error.message.includes('401') || error.message.includes('No autorizado')) {
        handle401Error();
      } else {
        // Manejar otros errores, posiblemente mostrar un toast de error
        setJoinError(error.message);
        toast.error(`Error al unirte: ${error.message}`);
      }
    } finally {
      setIsJoining(false);
    }
  };


  const handleJoinCampaign = () => {
    // ... (tu código actual de handleJoinCampaign) ...
    if (isAuthenticated) {
      // Try to join the campaign directly
      joinCampaign();
    } else {
      // Si no está autenticado, guarda el ID de la campaña y redirige al login
      localStorage.setItem('pendingCampaignId', reward.id.toString()); // Usar pendingCampaignId
      onClose();
      navigate('/signin');
    }
  };


  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="relative bg-[#0c0c0c] border border-[#1c1c1c] rounded-lg w-full max-w-2xl p-6 text-white mx-4
          sm:mx-4 sm:p-6
          md:mx-4 md:p-6
          lg:mx-4 lg:p-6
          min-h-[90vh] max-h-[95vh] overflow-y-auto
          sm:min-h-[unset] sm:max-h-[unset]"
        >
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-white z-50 p-2 sm:top-0 sm:right-0"
          >
            <X size={28} className="sm:w-6 sm:h-6" />
          </button>

          <div className="aspect-video w-full rounded-md overflow-hidden mb-4 relative max-h-48 sm:max-h-none">
            <img
              src={imageUrl}
              alt={reward.title}
              className="w-full h-full object-cover"
            />
          </div>

            <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center sm:text-left">{reward.title}</h2>
            <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">Creado por <span className="text-white">{reward.creator}</span></p>
            </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mb-6">
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Recompensa por 1K visitas</p>
              <p className="text-lg sm:text-xl font-semibold text-green-400">{reward.rate} USD</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Tipo de campaña</p>
              <p className="text-lg sm:text-xl font-semibold text-white">{reward.type}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs sm:text-sm text-gray-400 mb-1">Progreso del presupuesto</p>
            <p className="text-xs sm:text-sm mb-2">
              {formatCurrency(reward.paidAmount)} de {formatCurrency(reward.totalAmount)} gastado
            </p>
            <div className="h-2 w-full bg-[#1c1c1c] rounded-full overflow-hidden mb-2">
              <div
                className="bg-violet-500 h-full"
                style={{ width: `${reward.percentage}%` }}
              />
            </div>
            <p className="text-xs text-right text-gray-500">
              Progreso: {reward.percentage}%
            </p>
          </div>

          <div className="mb-6">
            <p className="text-xs sm:text-sm text-gray-400 mb-1">Plataformas</p>
            <div className="flex items-center gap-2">
              {reward.platform.toLowerCase().includes('tiktok') && (
                <div className="bg-[#1c1c1c] p-2 rounded-md">
                  <img
                    src="https://assets.whop.com/core/2afe54ae8a904906b22dfce0/_next/static/media/tiktok-logo.b77808fb.svg"
                    alt="TikTok"
                    className="h-6"
                  />
                </div>
              )}
              {reward.platform.toLowerCase().includes('instagram') && (
                <div className="bg-[#1c1c1c] p-2 rounded-md">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
              )}
              {reward.platform.toLowerCase().includes('youtube') && (
                <div className="bg-[#1c1c1c] p-2 rounded-md">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#ff0000">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {joinError && (
            <div className="mb-4 text-red-500 text-sm bg-red-500/10 border border-red-500/20 p-2 rounded">
              {joinError}
            </div>
          )}

          {/* Botones de acción */}
          <div className="grid grid-cols-1 gap-3 mt-4">
            {isCheckingStatus ? (
              <button className="w-full bg-gray-700 text-white font-bold py-4 px-4 rounded opacity-70 cursor-not-allowed text-base">
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando estado...
                </span>
              </button>
            ) : isAlreadyJoined ? (
            <button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 px-4 rounded text-base"
                onClick={handleViewCampaign}
              >
                Ver mi campaña
              </button>
            ) : (
              <button
                className={`w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 px-4 rounded text-base ${
                  isJoining ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              onClick={handleJoinCampaign}
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
            )}
            
            <button
              onClick={handleViewDetails}
              className="w-full bg-[#1c1c1c] hover:bg-[#252525] text-white font-medium py-4 px-4 rounded flex items-center justify-center gap-2 text-base"
            >
              Ver detalles completos
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5l6 6m0 0l-6 6m6-6H3"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de formulario de espera */}
      {/* Mantienes este si es necesario para otro flujo */}
      {showJoinModal && (
        <WaitlistFormModal onClose={() => setShowJoinModal(false)} reward={{ title: reward.title }} />
      )}
    </>
  );
};

export default WhopCreatorsModal;