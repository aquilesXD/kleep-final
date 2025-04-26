import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Link, useLocation } from 'react-router-dom';
import { LogoIcon } from '../../components/icons';
import { Home, MessageSquare, Bell, User, Search, Compass, Handshake, LayoutDashboard, Plus } from 'lucide-react';

// Función para verificar si el usuario está autenticado
const isUserAuthenticated = (): boolean => {
  const token = localStorage.getItem("authToken") || localStorage.getItem("token") || sessionStorage.getItem("authToken") || sessionStorage.getItem("token");
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return !!token || isAuthenticated;
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
  const [userAuthenticated, setUserAuthenticated] = useState(false); // Iniciar en falso por defecto
  
  // Efecto para verificar la autenticación
  useEffect(() => {
    const checkAuthentication = () => {
      const isAuth = isUserAuthenticated();
      setUserAuthenticated(isAuth);
      
      if (!isAuth) {
        // Reset notifications when logged out
        setHasUnreadNotifications(false);
        setUnreadCount(0);
      }
    };
    
    // Verificar inicialmente
    checkAuthentication();
    
    // Verificar cada vez que la ruta cambia
    const interval = setInterval(checkAuthentication, 1000);
    
    // Limpiar intervalo
    return () => clearInterval(interval);
  }, [location.pathname]);
  
  // Función para obtener el token actual
  const getAuthToken = (): string => {
    return localStorage.getItem("authToken") || 
           localStorage.getItem("token") || 
           sessionStorage.getItem("authToken") || 
           sessionStorage.getItem("token") || 
           "";
  };

  // Función para obtener el número de notificaciones no leídas
  const fetchUnreadNotifications = useCallback(async () => {
    // Verificar autenticación en tiempo real cada vez
    const isAuth = isUserAuthenticated();
    if (!isAuth) {
      setHasUnreadNotifications(false);
      setUnreadCount(0);
      return;
    }
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        setHasUnreadNotifications(false);
        setUnreadCount(0);
        return;
      }
      
      // Intentar hacer la petición con el formato Bearer
      let response = await fetch(`https://contabl.net/kleep/api/notifications/unread`, {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        // Si hay error de autenticación, marcar como no autenticado
        setHasUnreadNotifications(false);
        setUnreadCount(0);
        return;
      }

      if (!response.ok) {
        // Si hay error en la respuesta, no mostrar notificaciones
        setHasUnreadNotifications(false);
        setUnreadCount(0);
        return;
      }

      const data: UnreadResponse = await response.json();
      
      if (data.success) {
        // Solo mostrar notificaciones si verificamos nuevamente que el usuario está autenticado
        if (isUserAuthenticated()) {
          setHasUnreadNotifications(data.has_unread);
          setUnreadCount(data.unread_count);
        } else {
          setHasUnreadNotifications(false);
          setUnreadCount(0);
        }
      } else {
        setHasUnreadNotifications(false);
        setUnreadCount(0);
      }
    } catch (err) {
      return 0;
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

  // Escuchar el evento global 'userLoggedOut' para limpiar el estado
  useEffect(() => {
    const handleLogout = () => {
      setHasUnreadNotifications(false);
      setUnreadCount(0);
      setUserAuthenticated(false);
    };

    window.addEventListener('userLoggedOut', handleLogout);

    return () => {
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  // Cargar las notificaciones no leídas al iniciar y cada cierto tiempo
  useEffect(() => {
    // Solo ejecutar si el usuario está autenticado
    if (userAuthenticated) {
      // Cargar inmediatamente
      fetchUnreadNotifications();
      
      // Configurar un intervalo para verificar periódicamente
      const interval = setInterval(fetchUnreadNotifications, 30000);
      
      return () => clearInterval(interval);
    } else {
      // Asegurarse de que las notificaciones estén limpias
      setHasUnreadNotifications(false);
      setUnreadCount(0);
    }
  }, [fetchUnreadNotifications, userAuthenticated]);

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

          {/* Mostrar el botón de notificaciones solo si el usuario está autenticado */}
          {userAuthenticated && (
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
          )}

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
