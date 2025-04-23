import { useState, useEffect, useCallback } from "react";
import { Cog, MessageSquare, Heart, Share2, User, Bell, Check, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";

// Tipos de datos para las notificaciones
interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: number;
  created_at: string;
  date?: 'today' | 'yesterday' | 'older';
}

// Interfaz para la respuesta de la API de notificaciones
interface ApiResponse {
  notifications: Notification[];
}

// Interfaz para la respuesta de notificaciones no leídas
interface UnreadResponse {
  success: boolean;
  has_unread: boolean;
  unread_count: number;
}

// Get auth token from localStorage or sessionStorage
const getAuthToken = (): string => {
  return localStorage.getItem("authToken") || 
         localStorage.getItem("token") || 
         sessionStorage.getItem("authToken") || 
         sessionStorage.getItem("token") || 
         ""; // Devuelve cadena vacía si no encuentra token
};

// Función auxiliar para crear una fecha relativa
const getRelativeTimeString = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (hours < 1) return "Ahora";
  if (hours < 24) return `Hoy, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
  if (hours < 48) return `Ayer, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;

  return `${date.toLocaleDateString()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
};

// Determinar la categoría de fecha para una notificación
const getDateCategory = (dateString: string): 'today' | 'yesterday' | 'older' => {
  const date = new Date(dateString);
  const now = new Date();
  const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (hours < 24) return 'today';
  if (hours < 48) return 'yesterday';
  return 'older';
};

// Obtener un icono basado en el tipo de notificación
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'campaign_joined':
      return <Check size={24} className="text-green-500" />;
    case 'message':
      return <MessageSquare size={24} className="text-blue-500" />;
    case 'like':
      return <Heart size={24} className="text-red-500" />;
    case 'share':
      return <Share2 size={24} className="text-purple-500" />;
    default:
      return <Bell size={24} className="text-gray-500" />;
  }
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<{[key: string]: Notification[]}>({});
  const [showReadFeedback, setShowReadFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Función para obtener el número de notificaciones no leídas
  const fetchUnreadCount = useCallback(async () => {
    try {
      // Obtener el token mediante la función getAuthToken
      const token = getAuthToken();
      
      // Verificar que haya un token válido
      if (!token) {
        return; // Si no hay token, simplemente salimos sin mostrar error
      }
      
      // Intentar hacer la petición con el formato Bearer
      let response = await fetch(`https://contabl.net/kleep/api/notifications/unread`, {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Si el error es 401 (No autorizado), intentar con formatos alternativos
      if (response.status === 401) {
        // Intentar con formato alternativo (solo token sin Bearer)
        response = await fetch(`https://contabl.net/kleep/api/notifications/unread`, {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        // Si sigue fallando, intentar con query param
        if (response.status === 401) {
          response = await fetch(`https://contabl.net/kleep/api/notifications/unread?api_token=${token}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          // Si sigue fallando, es un problema de autenticación real pero no mostraremos error
          if (response.status === 401) {
            return;
          }
        }
      }

      if (!response.ok) {
        console.error(`Error al obtener notificaciones no leídas (${response.status})`);
        return;
      }

      const data: UnreadResponse = await response.json();
      
      if (data.success) {
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error('Error al obtener conteo de notificaciones:', err);
    }
  }, []);

  // Obtener notificaciones de la API
  useEffect(() => {
    let ignore = false;
    
    const fetchNotifications = async () => {
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
        let response = await fetch(`https://contabl.net/kleep/api/notifications`, {
          headers: {
            'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        // Si el error es 401 (No autorizado), intentar con formatos alternativos
        if (response.status === 401) {
          // Intentar con formato alternativo (solo token sin Bearer)
          response = await fetch(`https://contabl.net/kleep/api/notifications`, {
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          // Si sigue fallando, intentar con query param
          if (response.status === 401) {
            response = await fetch(`https://contabl.net/kleep/api/notifications?api_token=${token}`, {
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
          throw new Error(`Error al cargar las notificaciones (${response.status})`);
        }

        const data: ApiResponse = await response.json();
        
        // Añadir la categoría de fecha a cada notificación
        const notificationsWithDate = data.notifications.map(notification => ({
          ...notification,
          date: getDateCategory(notification.created_at)
        }));

        // Verificar si debemos ignorar esta respuesta (componente desmontado)
        if (!ignore) {
          setNotifications(notificationsWithDate);
          
          // Contar las notificaciones no leídas
          const unreadNotifications = notificationsWithDate.filter(n => n.read === 0);
          setUnreadCount(unreadNotifications.length);
          
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
          console.error('Error al cargar las notificaciones:', errorMessage);
          setError(errorMessage);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchNotifications();
    
    // También obtener el conteo de no leídas de forma separada
    fetchUnreadCount();
    
    // Limpieza al desmontar el componente
    return () => {
      ignore = true;
    };
  }, [fetchUnreadCount]);

  // Agrupar notificaciones por fecha
  useEffect(() => {
    const grouped = notifications.reduce((acc, notification) => {
      const key = notification.date || 'older';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(notification);
      return acc;
    }, {} as {[key: string]: Notification[]});

    setGroupedNotifications(grouped);
  }, [notifications]);

  // Marcar todas las notificaciones como leídas
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      // Obtener el token mediante la función getAuthToken
      const token = getAuthToken();
      
      // Verificar que haya un token válido
      if (!token) {
        setIsAuthError(true);
        throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
      }

      // Mostrar feedback mientras se procesa
      setShowReadFeedback(true);

      // Llamar a la API para marcar todas las notificaciones como leídas
      const response = await fetch(`https://contabl.net/kleep/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error al marcar notificaciones como leídas (${response.status})`);
      }

      // Actualizar el estado local
      setNotifications(prev => prev.map(notif => ({ ...notif, read: 1 })));
      setUnreadCount(0);
      
      // Mantener el mensaje de éxito visible por un tiempo
      setTimeout(() => setShowReadFeedback(false), 3000);
      
      // Disparar un evento para actualizar el contador en el Sidebar
      window.dispatchEvent(new CustomEvent('notificationsRead'));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error al marcar notificaciones como leídas:', errorMessage);
      setShowReadFeedback(false);
      
      // Mostrar error al usuario
      alert(`Error: ${errorMessage}`);
    }
  }, []);

  // Marcar una notificación como leída
  const handleMarkAsRead = useCallback(async (id: number) => {
    try {
      // Obtener el token mediante la función getAuthToken
      const token = getAuthToken();
      
      // Verificar que haya un token válido
      if (!token) {
        setIsAuthError(true);
        throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
      }

      // Llamar a la API para marcar la notificación como leída usando el endpoint correcto
      const response = await fetch(`https://contabl.net/kleep/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error al marcar notificación como leída (${response.status})`);
      }

      // Actualizar el estado local
      setNotifications(prev => {
        const updated = prev.map(notif => 
          notif.id === id ? { ...notif, read: 1 } : notif
        );
        
        // Actualizar el contador de no leídas
        const unreadNotifications = updated.filter(n => n.read === 0);
        setUnreadCount(unreadNotifications.length);
        
        return updated;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error al marcar notificación como leída:', errorMessage);
    }
  }, []);

  // Manejar clic en una notificación
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (notification.read === 0) {
      handleMarkAsRead(notification.id);
    }
    
    // Navegar según el tipo de notificación
    if (notification.type === 'campaign_joined') {
      // Extraer ID de campaña si está presente en el mensaje
      const campaignId = notification.message.match(/campaña: (.+?)$/)?.[1] || "1";
      navigate(`/campaigns/${campaignId}`);
    }
  }, [handleMarkAsRead, navigate]);

  // Mostrar estado de carga
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col w-full h-full min-h-screen bg-[#121212] text-white">
          <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#1c1c1c] px-4 py-3">
            <h1 className="text-xl font-bold">Notificaciones</h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-300">Cargando notificaciones...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Mostrar mensaje de error
  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col w-full h-full min-h-screen bg-[#121212] text-white">
          <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#1c1c1c] px-4 py-3">
            <h1 className="text-xl font-bold">Notificaciones</h1>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            {isAuthError ? (
              <button 
                onClick={() => navigate('/campaign-home')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Iniciar sesión
              </button>
            ) : (
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col w-full h-full min-h-screen bg-[#121212] text-white">
        {/* Header Principal */}
        <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#1c1c1c] px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">Notificaciones</h1>
          {unreadCount > 0 && (
            <div className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
              {unreadCount} no leídas
            </div>
          )}
        </div>

        {/* Barra de navegación simplificada */}
        <div className="sticky top-14 z-10 bg-[#121212] border-b border-[#1c1c1c] px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex">
              <span className="px-4 py-2 text-sm font-medium text-white">
                Toda la actividad
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {showReadFeedback && (
                <span className="text-sm text-green-500 mr-2 flex items-center">
                  <CheckCircle size={16} className="mr-1" />
                  Todas las notificaciones marcadas como leídas
                </span>
              )}
              <button
                onClick={handleMarkAllAsRead}
                className={`px-3 py-1.5 rounded-md ${unreadCount === 0 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-violet-600 hover:bg-violet-700 text-white'} 
                  transition-colors flex items-center gap-2`}
                disabled={unreadCount === 0 || showReadFeedback}
              >
                {showReadFeedback ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Marcar todo como leído</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="flex-1">
          {Object.entries(groupedNotifications).map(([date, notifications]) => (
            <div key={date} className="border-b border-[#1c1c1c]">
              {/* Encabezado de fecha */}
              {date !== 'older' && (
                <div className="py-1 px-4 text-xs text-gray-500 uppercase bg-[#0f0f0f]">
                  {date === 'today' ? 'Hoy' : date === 'yesterday' ? 'Ayer' : date}
                </div>
              )}

              {/* Lista de notificaciones */}
              <div className="divide-y divide-[#1c1c1c]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="px-4 py-3 flex items-start">
                      {/* Punto de notificación */}
                      <div className="mt-[14px] mr-3 min-w-[8px]">
                        {notification.read === 0 && (
                          <div className="w-[8px] h-[8px] bg-[#2563eb] rounded-full"></div>
                        )}
                      </div>

                      {/* Icono */}
                      <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Contenido */}
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm">
                            {notification.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getRelativeTimeString(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Estado vacío */}
          {Object.keys(groupedNotifications).length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 p-6">
              <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                <Bell className="text-gray-500" size={24} />
              </div>
              <h2 className="text-lg font-medium text-white mb-2">
                No hay notificaciones
              </h2>
              <p className="text-gray-400 text-center text-sm max-w-md">
                No tienes notificaciones actualmente
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
