import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Settings, Link2, ShieldCheck, CreditCard, DollarSign, LogOut, House, LayoutDashboard } from 'lucide-react';
import { logout, getAuthToken } from '../../services/authService';
import { useUserStore } from '../../stores/userStore';

interface ProfileSidebarProps {
  mobile?: boolean;
  onCloseMobileMenu?: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ mobile, onCloseMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, isLoading, fetchUserData } = useUserStore();

  // Obtener el nombre del usuario al cargar el componente
  useEffect(() => {
    fetchUserData();
  }, []);

  // Función para obtener las iniciales de un nombre
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return name.length > 1 ? name.substring(0, 2).toUpperCase() : name.substring(0, 1).toUpperCase();
    } else {
      return words.slice(0, 2).map(word => word[0].toUpperCase()).join('');
    }
  };

  // Generar un color basado en el nombre del usuario
  const getAvatarColor = (): string => {
    const colors = [
      '#8e4dff',
      '#6d28d9',
      '#9333ea',
      '#7c3aed',
      '#a855f7',
    ];
    const hash = (userData?.name || 'Usuario').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Renderizar avatar de usuario
  const renderUserAvatar = () => {
    if (isLoading) {
      return (
        <div
          className={`mb-3 rounded-full ${mobile ? 'w-[60px] h-[60px]' : 'w-[80px] h-[80px]'}
                    flex items-center justify-center text-white bg-gray-700 animate-pulse`}
        />
      );
    }
    
    if (userData?.profile_image) {
      // Asegurarse de que la URL de la imagen sea completa
      const imageUrl = userData.profile_image.startsWith('http')
        ? userData.profile_image
        : `https://contabl.net/kleep${userData.profile_image.startsWith('/') ? '' : '/'}${userData.profile_image}`;
      
      return (
        <div className={`mb-3 rounded-full ${mobile ? 'w-[60px] h-[60px]' : 'w-[80px] h-[80px]'} overflow-hidden`}>
          <img 
            src={imageUrl}
            alt={userData.name || 'Usuario'} 
            className="w-full h-full object-cover"
            onError={() => {
              useUserStore.getState().updateUserData({ profile_image: undefined });
            }}
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
        {getInitials(userData?.name || 'Usuario')}
      </div>
    );
  };

  // Definimos todos los items del menú
  const allMenuItems = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
      path: '/campaign-home',
      show: true
    },
    {
      title: 'General',
      icon: <Settings size={18} strokeWidth={1.75} />,
      path: '/profile',
      show: true
    },
    {
      title: 'Cuentras conectadas',
      icon: <Link2 size={18} strokeWidth={1.75} />,
      path: '/profile-cuentas',
      show: true
    },
    {
      title: 'Seguridad',
      icon: <ShieldCheck size={18} strokeWidth={1.75} />,
      path: '/profile-seguridad',
      show: false
    },
    {
      title: 'Formas de pago',
      icon: <CreditCard size={18} strokeWidth={1.75} />,
      path: '/profile-formas-de-pago',
      show: false
    },
    {
      title: 'Saldo',
      icon: <DollarSign size={18} strokeWidth={1.75} />,
      path: '/profile-saldo',
      show: true
    },
  ];

  // Filtrar solo los elementos que se deben mostrar
  const menuItems = allMenuItems.filter(item => item.show);

  const handleLogout = () => {
    logout();
    navigate('/campaign-home');
  };

  return (
    <div className="h-full bg-[#0c0c0c]">
      <div className={`flex flex-col items-center ${mobile ? 'px-2 py-4' : 'p-5 pb-6'} border-b border-[#1c1c1c]`}>
        {renderUserAvatar()}
        <h3 className={`mb-1 ${mobile ? 'text-base' : 'text-lg'} font-medium`}>
          {userData?.name || 'Usuario'}
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
              location.pathname === item.path ? 'text-white font-medium' : 'text-gray-400 font-medium'
            }`}
            onClick={mobile && onCloseMobileMenu ? onCloseMobileMenu : undefined}
          >
            <span className="mr-3">
              {item.icon}
            </span>
            {item.title}
          </Link>
        ))}

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