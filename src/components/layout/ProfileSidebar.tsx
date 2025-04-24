import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Settings, Link2, ShieldCheck, CreditCard, DollarSign, LogOut } from 'lucide-react';
import { logout, getAuthToken } from '../../services/authService';

interface ProfileSidebarProps {
  mobile?: boolean;
  onCloseMobileMenu?: () => void;
}

interface UserData {
  name?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image?: string;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ mobile, onCloseMobileMenu }) => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('Usuario');
  const [userInitials, setUserInitials] = useState<string>('U');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  

  // Obtener el nombre del usuario al cargar el componente
  useEffect(() => {
    fetchUserData();
  }, []);

  // Función para obtener los datos del usuario desde la API
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        // Si no hay token, redirigir al login
        navigate('/login');
        return;
      }

      // Intentar obtener los datos del usuario desde la API
      const response = await fetch('https://contabl.net/kleep/api/user', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
        },
      });

      // Si hay error 401, intentar con formato alternativo
      let userData: UserData | null = null;
      
      if (response.status === 401) {
        // Intentar con token sin Bearer
        const altResponse = await fetch('https://contabl.net/kleep/api/user', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': authToken,
          },
        });
        
        // Si sigue fallando, intentar con query param
        if (altResponse.status === 401) {
          const queryResponse = await fetch(`https://contabl.net/kleep/api/user?api_token=${encodeURIComponent(authToken)}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });
          
          if (queryResponse.ok) {
            const data = await queryResponse.json();
            userData = data.user || data;
          }
        } else if (altResponse.ok) {
          const data = await altResponse.json();
          userData = data.user || data;
        }
      } else if (response.ok) {
        const data = await response.json();
        userData = data.user || data;
      }

      // Si obtuvimos datos de usuario desde la API
      if (userData) {
        console.log('User data from API:', userData);
        
        // Establecer el nombre de usuario
        if (userData.name) {
          setUserName(userData.name);
          setUserInitials(getInitials(userData.name));
        } else if (userData.username) {
          setUserName(userData.username);
          setUserInitials(getInitials(userData.username));
        } else if (userData.first_name) {
          const fullName = userData.last_name 
            ? `${userData.first_name} ${userData.last_name}`
            : userData.first_name;
          setUserName(fullName);
          setUserInitials(getInitials(fullName));
        } else if (userData.email) {
          const emailName = userData.email.split('@')[0];
          setUserName(emailName);
          setUserInitials(getInitials(emailName));
        }
        
        // Establecer la imagen de perfil
        if (userData.profile_image) {
          setProfileImage(userData.profile_image);
        }
      } else {
        // Si no se pudieron obtener datos de la API, intentar con localStorage
        getUserDataFromLocalStorage();
      }
    } catch (error) {
      console.error('Error fetching user data from API:', error);
      // Fallar silenciosamente y usar datos locales
      getUserDataFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener los datos del usuario desde localStorage (fallback)
  const getUserDataFromLocalStorage = () => {
    // Intentar obtener datos del usuario desde localStorage
    const storedApiResponse = localStorage.getItem('apiResponse');

    if (storedApiResponse) {
      try {
        const parsedData = JSON.parse(storedApiResponse);

        // Verificar si hay datos en la respuesta
        if (parsedData && parsedData.data && Array.isArray(parsedData.data) && parsedData.data.length > 0) {
          // Obtener el first_name del primer elemento si existe
          const first_name = parsedData.data[0].first_name;

          if (first_name && typeof first_name === 'string' && first_name.trim() !== '') {
            setUserName(first_name);
            // Obtener las iniciales del nombre
            setUserInitials(getInitials(first_name));
            return;
          }
        }

        // Si no hay datos o no se encuentra el first_name, usar el email como nombre
        const email = localStorage.getItem('userEmail');
        if (email) {
          // Extraer la parte del nombre del email (antes del @)
          const emailName = email.split('@')[0];
          setUserName(emailName);
          // Obtener las iniciales del email
          setUserInitials(getInitials(emailName));
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Si no hay datos o hay un error, mantener el nombre por defecto
    const email = localStorage.getItem('userEmail');
    if (email) {
      const emailName = email.split('@')[0];
      setUserName(emailName);
      setUserInitials(getInitials(emailName));
    }
  };

  // Función para obtener las iniciales de un nombre
  const getInitials = (name: string): string => {
    if (!name) return 'U';

    // Dividir el nombre en palabras y tomar la primera letra de cada palabra
    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      // Si es una sola palabra, tomar las dos primeras letras o la primera si es muy corta
      return name.length > 1 ? name.substring(0, 2).toUpperCase() : name.substring(0, 1).toUpperCase();
    } else {
      // Si hay múltiples palabras, tomar la primera letra de cada una (hasta 2)
      return words.slice(0, 2).map(word => word[0].toUpperCase()).join('');
    }
  };

  // Generar un color basado en el nombre del usuario (para el fondo del avatar)
  const getAvatarColor = (): string => {
    const colors = [
      '#8e4dff', // Púrpura principal del tema
      '#6d28d9', // Púrpura más oscuro
      '#9333ea', // Otro tono de púrpura
      '#7c3aed', // Púrpura violeta
      '#a855f7', // Púrpura claro
    ];

    // Usar el nombre de usuario para seleccionar un color
    const hash = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Definimos todos los items del menú, pero solo mostraremos algunos
  const allMenuItems = [
    {
      title: 'General',
      icon: <Settings size={18} strokeWidth={1.75} />,
      path: '/profile',
      show: true // Mostrar este elemento
    },
    {
      title: 'Cuentras conectadas',
      icon: <Link2 size={18} strokeWidth={1.75} />,
      path: '/profile-cuentas',
      show: true // Mostrar este elemento
    },
    {
      title: 'Seguridad',
      icon: <ShieldCheck size={18} strokeWidth={1.75} />,
      path: '/profile-seguridad',
      show: false // Ocultar este elemento
    },
    {
      title: 'Formas de pago',
      icon: <CreditCard size={18} strokeWidth={1.75} />,
      path: '/profile-formas-de-pago',
      show: false // Ocultar este elemento
    },
    {
      title: 'Saldo',
      icon: <DollarSign size={18} strokeWidth={1.75} />,
      path: '/profile-saldo',
      show: true // Mostrar este elemento
    },
  ];

  // Filtrar solo los elementos que se deben mostrar
  const menuItems = allMenuItems.filter(item => item.show);

  const handleLogout = () => {
    // Usar el servicio de autenticación para cerrar sesión
    logout();

    // Redireccionar al login
    navigate('/campaign-home');
  };

  // Renderizar avatar de usuario basado en si tiene imagen de perfil o no
  const renderUserAvatar = () => {
    if (isLoading) {
      return (
        <div
          className={`mb-3 rounded-full ${mobile ? 'w-[60px] h-[60px]' : 'w-[80px] h-[80px]'}
                    flex items-center justify-center text-white bg-gray-700 animate-pulse`}
        />
      );
    }
    
    if (profileImage) {
      return (
        <div className={`mb-3 rounded-full ${mobile ? 'w-[60px] h-[60px]' : 'w-[80px] h-[80px]'} overflow-hidden`}>
          <img 
            src={profileImage} 
            alt={userName} 
            className="w-full h-full object-cover"
            onError={() => setProfileImage(null)} // Si la imagen falla, mostrar iniciales
          />
        </div>
      );
    }
    
    return (
      <div
        className={`mb-3 rounded-full ${mobile ? 'w-[60px] h-[60px]' : 'w-[80px] h-[80px]'}
                  flex items-center justify-center text-white font-bold
                  ${mobile ? 'text-xl' : 'text-2xl'}`}
        style={{ backgroundColor: getAvatarColor() }}
      >
        {userInitials}
      </div>
    );
  };

  return (
    <div className="h-full bg-[#0c0c0c]">
      <div className={`flex flex-col items-center ${mobile ? 'px-2 py-4' : 'p-5 pb-6'} border-b border-[#1c1c1c]`}>
        {renderUserAvatar()}
        <h3 className={`mb-1 ${mobile ? 'text-base' : 'text-lg'} font-medium`}>
          {userName}
        </h3>
        <div className="mt-1">
          <span className="text-xs text-[#8c52ff] font-medium">
            
          </span>
        </div>
      </div>

      <div className="flex flex-col py-2">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`flex items-center ${mobile ? 'px-3 py-2 text-[14px]' : 'px-6 py-2.5 text-[15px]'} ${
              path === item.path ? 'text-white font-medium' : 'text-gray-400 font-medium'
            }`}
            onClick={mobile && onCloseMobileMenu ? onCloseMobileMenu : undefined}
          >
            <span className="mr-3">
              {item.icon}
            </span>
            {item.title}
          </Link>
        ))}

        {/* Botón de cierre de sesión */}
        <button
          onClick={handleLogout}
          className={`flex items-center ${mobile ? 'px-3 py-2 text-[14px]' : 'px-6 py-2.5 text-[15px]'}
          text-red-500 font-medium mt-auto border-t border-[#1c1c1c] pt-4 mt-4`}
        >
          <span className="mr-3">
            <LogOut size={18} strokeWidth={1.75} />
          </span>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default ProfileSidebar;
