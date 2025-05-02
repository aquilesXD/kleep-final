import { useEffect, useState } from 'react';

import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Gift, Video, Flag, SquarePen, Megaphone } from 'lucide-react';
function getAuthToken(): string | null {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('token')
  );
}

const menuItems = [
  { label: 'Resumen', icon: HomeIcon, path: '', onlyIfJoined: false },
  { label: 'Comienza Aquí', icon: Flag, path: '/start', onlyIfJoined: true },
  { label: 'Recompensas', icon: Gift, path: '/rewards', onlyIfJoined: true },
  { label: 'Mis Videos', icon: Video, path: '/videos', onlyIfJoined: true }
];

export function CampaignSidebar({ activeItem = "overview" }) {
  const { campaignId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isJoined: false,
    loading: true
  });

  const [campaignData, setCampaignData] = useState<any>(null);

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        const token = getAuthToken();
        const url = token
          ? `https://contabl.net/kleep/api/campaigns/${campaignId}`
          : `https://contabl.net/kleep/api/campaigns/public/${campaignId}`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        if (token) {
          headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });

        if (response.ok) {
          const data = await response.json();
          setCampaignData(data.campaign);
        }
      } catch (error) {
        console.error('Error fetching campaign data:', error);
      }
    };

    fetchCampaignData();
  }, [campaignId]);

  useEffect(() => {
    const checkAuthAndJoinStatus = async () => {
      const token = getAuthToken();
      const isAuthenticated = !!token;
      let isJoined = false;

      if (isAuthenticated && campaignId) {
        try {
          const response = await fetch('https://contabl.net/kleep/api/campaigns/joined', {
            headers: {
              Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json'
            }
          });

          const data = await response.json();

          if (data.success) {
            const joined = data.campaigns.find((c: any) => c.id === parseInt(campaignId));
            isJoined = !!joined;
          }
        } catch (err) {
          console.error('Error al verificar unión:', err);
        }
      }

      setAuthState({
        isAuthenticated,
        isJoined,
        loading: false
      });
    };

    checkAuthAndJoinStatus();
  }, [campaignId]);

  if (authState.loading) {
    return (
      <aside className="w-full lg:w-[375px] lg:min-h-screen border-r border-[#2a2a2a] p-6 bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[375px] lg:min-h-screen border-r border-[#2a2a2a] p-6 bg-[#121212]">
      {campaignData?.banner_image && (
        <div className="relative h-[150px] rounded-xl overflow-hidden mb-6">
          <img
            src={campaignData.banner_image}
            alt="Banner de la campaña"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute top-4 left-4 flex items-center z-10">
            <img
              src={campaignData.profile_image}
              alt="Admin"
              width={24}
              height={24}
              className="rounded mr-2 border border-white/40"
            />
            <span className="font-semibold text-white">{campaignData.admin_name}</span>
          </div>
        </div>
      )}

<nav className="space-y-2">
  {menuItems.map((item, index) => {
    const fullPath =
    item.label === 'Resumen'
    ? `/campaign/${campaignId}`
    : `/campaign/${campaignId}${item.path}`;

    const isActive = location.pathname === fullPath;
    const mostrar = !item.onlyIfJoined || (authState.isAuthenticated && authState.isJoined);

    if (!mostrar) return null;

    const buttonClass = `flex items-center px-4 py-3 rounded-xl font-semibold text-base text-white ${
      isActive ? 'bg-[#1c1c1c]' : 'hover:bg-[#1c1c1c]'
    }`;

    return (
      <Link key={index} to={fullPath} className={buttonClass}>
        <div className="w-[30px] h-[30px] bg-blue-600 rounded flex items-center justify-center mr-3">
          <item.icon size={18} className="text-white" />
        </div>
        {item.label.toUpperCase()}
      </Link>
    );
  })}
</nav>
    </aside>
  );
}
