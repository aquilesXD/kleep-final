import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Link, useLocation } from 'react-router-dom';
import { LogoIcon } from '../../components/icons';
import { Home, MessageSquare, Bell, User, Search, Compass, Handshake, LayoutDashboard, Plus } from 'lucide-react';

// Get auth token from localStorage or sessionStorage
const getAuthToken = (): string => {
  return localStorage.getItem("authToken") || 
         localStorage.getItem("token") || 
         sessionStorage.getItem("authToken") || 
         sessionStorage.getItem("token") || 
         ""; // Devuelve cadena vacía si no encuentra token
};

// Interfaz para la respuesta de notificaciones no leídas
interface UnreadResponse {
  success: boolean;
  has_unread: boolean;
  unread_count: number;
}

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Función para obtener el número de notificaciones no leídas
  const fetchUnreadNotifications = useCallback(async () => {
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
        setHasUnreadNotifications(data.has_unread);
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error('Error al obtener notificaciones:', err);
    }
  }, []);

  // Escuchar el evento global para abrir el modal de búsqueda
  useEffect(() => {
    const handleOpenSearchModal = () => {
      setIsSearchModalOpen(true);
    };

    window.addEventListener("openSearchModal", handleOpenSearchModal);
    return () => {
      window.removeEventListener("openSearchModal", handleOpenSearchModal);
    };
  }, []);

  // Escuchar el evento cuando se marcan todas las notificaciones como leídas
  useEffect(() => {
    const handleNotificationsRead = () => {
      setHasUnreadNotifications(false);
      setUnreadCount(0);
    };

    window.addEventListener("notificationsRead", handleNotificationsRead);
    return () => {
      window.removeEventListener("notificationsRead", handleNotificationsRead);
    };
  }, []);

  // Cargar las notificaciones no leídas al iniciar y cada cierto tiempo
  useEffect(() => {
    // Cargar inmediatamente
    fetchUnreadNotifications();
    
    // Configurar un intervalo para verificar periódicamente (cada 60 segundos)
    const interval = setInterval(fetchUnreadNotifications, 60000);
    
    // Limpiar el intervalo al desmontar
    return () => clearInterval(interval);
  }, [fetchUnreadNotifications]);

  // Manejador simple del botón de búsqueda
  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSearchModalOpen(true);
  };

  return (
    <>
      <div className="fixed left-0 top-0 z-30 h-full w-16 bg-[#0c0c0c] border-r border-[#1c1c1c] flex flex-col items-center">
        <div className="pt-4 pb-8">
        <Link to="/">
         <div className="logo mt-4 text-center">
          <LogoIcon width={25} height={25} className="mx-auto" />
          </div>
        </Link>
        </div>

        <div className="flex flex-col items-center justify-center h-full gap-3">


        <Link
          to="/campaign-home"
          className="flex h-10 w-10 items-center justify-center text-white rounded-md bg-[#191919] hover:bg-[#161616]"
          title="Home"
        >
          <Home size={20} strokeWidth={1.5} />
        </Link>


        <Link
          to="/notifications"
          className={`flex h-10 w-10 items-center justify-center text-white rounded-md ${
            path.includes('/notifications') ? 'bg-[#161616]' : 'bg-[#191919]'
          } hover:bg-[#161616] relative`}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={20} strokeWidth={1.5} />
          {hasUnreadNotifications && (
            <div className="absolute -top-1 -right-1 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            </div>
          )}
        </Link>

        <Link
          to="/profile"
          className="flex h-10 w-10 items-center justify-center text-white rounded-md bg-[#191919] hover:bg-[#161616]"
          title="Profile"
        >
          <User size={20} strokeWidth={1.5} />
        </Link>
        </div>
      </div>

    </>
  );
};

export default Sidebar;
