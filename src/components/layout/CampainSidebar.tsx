import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SquarePen, Gift, Video, Megaphone } from 'lucide-react';
import { getAuthToken } from '../../services/authService';

interface ProfileSidebarProps {
  activeItem?: string;
}

// Valores por defecto
const defaultBanner = "https://img-v2-prod.whop.com/rEuqtdgmTyTyI2bULxNzKfor_PpwqFmSgZj4FyUWvx0/rs:fit:1280:720/el:1/dpr:2/aHR0cHM6Ly9hc3NldHMud2hvcC5jb20vdXBsb2Fkcy8yMDI1LTAxLTI2L3VzZXJfMjE3MzE2OF83NjA0ZmU3OC02MmYwLTQ1ZTctYjFjZS1jNmZlOGVhYzQ3MGQuanBlZw";

export function CampaignSidebar({ activeItem = "overview" }: ProfileSidebarProps) {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isJoined: false,
    loading: true
  });
  const [campaignData, setCampaignData] = useState<any>(null);
  const { campaignId = "1" } = useParams<{ campaignId: string }>();

  // Obtener datos de la campaña
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}`, {
          headers: {
            'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCampaignData(data.campaign);
        }
      } catch (error) {
        
      }
    };

    fetchCampaignData();
  }, [campaignId]);

  // Verificar autenticación y estado de unión a la campaña
  useEffect(() => {
    const checkAuthAndJoinedStatus = async () => {
      try {
        const token = getAuthToken();
        const isAuth = Boolean(token);
        
        if (!isAuth) {
          setAuthState({ isAuthenticated: false, isJoined: false, loading: false });
          return;
        }

        // Verificar si está unido a la campaña
        const response = await fetch(`https://contabl.net/kleep/api/campaigns/joined`, {
          headers: {
            'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const isJoined = data.campaigns?.some((campaign: any) => campaign.id === parseInt(campaignId));
          setAuthState({ isAuthenticated: true, isJoined, loading: false });
        } else {
          setAuthState({ isAuthenticated: true, isJoined: false, loading: false });
        }
      } catch (error) {
        
        setAuthState({ isAuthenticated: false, isJoined: false, loading: false });
      }
    };

    checkAuthAndJoinedStatus();
  }, [campaignId]);

  // Si está cargando, mostrar un spinner
  if (authState.loading) {
    return (
      <aside className="w-full lg:w-[375px] lg:min-h-screen border-r border-[#2a2a2a] p-6 bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[375px] lg:min-h-screen border-r border-[#2a2a2a] p-6 bg-[#121212]">
      {/* Banner de la campaña */}
      {campaignData?.banner_image && (
        <div className="relative h-[150px] rounded-xl overflow-hidden mb-6">
          <img
            src={campaignData.banner_image}
            alt="Banner de la campaña"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
      )}

      {/* Menú de navegación */}
      <nav className="space-y-2">
        {/* Botón de Resumen (siempre visible) */}
        <Link
          to="/campaign"
          className={`flex items-center px-4 py-3 rounded-xl font-semibold text-base text-white ${activeItem === "overview" ? "bg-[#1c1c1c]" : "hover:bg-[#1c1c1c]"}`}
        >
          <div className="w-[30px] h-[30px] bg-blue-600 rounded flex items-center justify-center mr-3">
            <SquarePen size={18} className="text-white" />
          </div>
          Resumen
        </Link>

        {/* Botones que solo se muestran cuando el usuario está autenticado y unido */}
        {authState.isAuthenticated && authState.isJoined && (
          <>
            <Link
              to={`/campaigns/${campaignId}/start`}
              className={`flex items-center px-4 py-3 rounded-xl font-semibold text-base text-white ${activeItem === "start" ? "bg-[#1c1c1c]" : "hover:bg-[#1c1c1c]"}`}
            >
              <div className="w-[30px] h-[30px] bg-blue-600 rounded flex items-center justify-center mr-3">
                <SquarePen size={18} className="text-white" />
              </div>
              COMIENZA AQUI
            </Link>

            <Link
              to={`/campaigns/${campaignId}/rewards`}
              className={`flex items-center px-4 py-3 rounded-xl font-semibold text-base text-white ${activeItem === "rewards" ? "bg-[#1c1c1c]" : "hover:bg-[#1c1c1c]"}`}
            >
              <div className="w-[30px] h-[30px] bg-blue-600 rounded flex items-center justify-center mr-3">
                <Gift size={18} className="text-white" />
              </div>
              RECOMPENSAS
            </Link>

            <Link
              to={`/campaigns/${campaignId}/videos`}
              className={`flex items-center px-4 py-3 rounded-xl font-semibold text-base text-white ${activeItem === "videos" ? "bg-[#1c1c1c]" : "hover:bg-[#1c1c1c]"}`}
            >
              <div className="w-[30px] h-[30px] bg-blue-600 rounded flex items-center justify-center mr-3">
                <Video size={18} className="text-white" />
              </div>
              MIS VIDEOS
            </Link>

            <Link
              to={`/campaigns/${campaignId}/ads`}
              className={`flex items-center px-4 py-3 rounded-xl font-semibold text-base text-white ${activeItem === "announcements" ? "bg-[#1c1c1c]" : "hover:bg-[#1c1c1c]"}`}
            >
              <div className="w-[30px] h-[30px] bg-blue-600 rounded flex items-center justify-center mr-3">
                <Megaphone size={18} className="text-white" />
              </div>
              ANUNCIOS
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}