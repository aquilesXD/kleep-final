import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Settings, Link2, ShieldCheck, CreditCard, DollarSign, LogOut } from 'lucide-react';
import { logout } from '../../services/authService';

interface ProfileSidebarProps {
  mobile?: boolean;
  onCloseMobileMenu?: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ mobile, onCloseMobileMenu }) => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('Usuario');
  const [userInitials, setUserInitials] = useState<string>('U');
  


  // Obtener el nombre del usuario al cargar el componente
  useEffect(() => {
    getUserData();
  }, []);

  // Función para obtener los datos del usuario
  const getUserData = () => {
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
    navigate('/signin');
  };

  return (
    <div className="h-full bg-[#0c0c0c]">
      <div className={`flex flex-col items-center ${mobile ? 'px-2 py-4' : 'p-5 pb-6'} border-b border-[#1c1c1c]`}>
        <div
          className={`mb-3 rounded-full ${mobile ? 'w-[60px] h-[60px]' : 'w-[80px] h-[80px]'}
                    flex items-center justify-center text-white font-bold
                    ${mobile ? 'text-xl' : 'text-2xl'}`}
          style={{ backgroundColor: getAvatarColor() }}
        >
          {userInitials}
        </div>
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
