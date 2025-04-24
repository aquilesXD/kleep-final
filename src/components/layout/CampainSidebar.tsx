import { Link } from "react-router-dom"
import { Video, BarChart2, Medal, MapPin, SquarePen } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

interface ProfileSidebarProps {
  activeItem?: "overview" | "start-here" | "rewards" | "videos" | "ads"
}

interface Campaign {
  id: number;
  name: string;
  banner_image: string;
  logo?: string;
}

// Función para obtener el token de autenticación
const getAuthToken = (): string => {
  return localStorage.getItem("authToken") || 
         localStorage.getItem("token") || 
         sessionStorage.getItem("authToken") || 
         sessionStorage.getItem("token") || 
         "";
};

export function CampaignSidebar({ activeItem = "overview" }: ProfileSidebarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [campaignData, setCampaignData] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener los datos de la campaña
  const fetchCampaignData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }
      
      const response = await fetch('https://contabl.net/kleep/api/campaigns', {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos de campaña: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Asumimos que la API devuelve un array de campañas o un objeto con una propiedad campaigns
      let campaigns = Array.isArray(data) ? data : Array.isArray(data.campaigns) ? data.campaigns : [];
      
      // Tomamos la primera campaña si existe
      if (campaigns.length > 0) {
        setCampaignData(campaigns[0]);
      }
      
    } catch (err) {
      // Eliminar console.error
      // console.error('Error al cargar datos de campaña:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar autenticación y cargar datos al montar el componente
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const userEmail = localStorage.getItem("userEmail");
    const isAuth = Boolean(authStatus && userEmail);
    setIsAuthenticated(isAuth);
    
    // Cargar datos de campaña sin importar el estado de autenticación
    fetchCampaignData();
  }, [fetchCampaignData]);

  // Banner fallback (imagen por defecto)
  const defaultBanner = "https://img-v2-prod.whop.com/rEuqtdgmTyTyI2bULxNzKfor_PpwqFmSgZj4FyUWvx0/rs:fit:1280:720/el:1/dpr:2/aHR0cHM6Ly9hc3NldHMud2hvcC5jb20vdXBsb2Fkcy8yMDI1LTAxLTI2L3VzZXJfMjE3MzE2OF83NjA0ZmU3OC02MmYwLTQ1ZTctYjFjZS1jNmZlOGVhYzQ3MGQuanBlZw";
  const defaultLogo = "https://img-v2-prod.whop.com/6h3sfg_FqzkV8VtmHQ41wHmNYgK6xQepCrUU9lSl0wI/rs:fill:80:80/el:1/dpr:2/aHR0cHM6Ly9hc3NldHMud2hvcC5jb20vdXBsb2Fkcy8yMDI1LTAyLTExL3VzZXJfMjE3MzE2OF85NTc2MmVhOS1kZjdhLTQ2OWItODE5YS1lZGI5NTcwZGMwYzguanBlZw";
  const defaultName = "Campaña";

  return (
    <aside className="w-full lg:w-[375px] lg:min-h-screen border-r border-[#2a2a2a] p-6 bg-[#121212]">
      <div className="relative h-[150px] rounded-xl overflow-hidden mb-6">
        <img
          src={campaignData?.banner_image || defaultBanner}
          alt="Campaign banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute top-4 left-4 flex items-center z-10">
          <img
            src={campaignData?.logo || defaultLogo}
            alt="Campaign logo"
            width={24}
            height={24}
            className="rounded mr-2 border border-white/40"
          />
          <span className="font-semibold text-white">
            {loading ? "Cargando..." : campaignData?.name || defaultName}
          </span>
        </div>
      </div>

      <nav className="space-y-2">
        <Link
          to="/campaign"
          className={`flex items-center px-4 py-3 rounded-xl font-semibold text-base text-white ${activeItem === "overview" ? "bg-[#1c1c1c]" : "hover:bg-[#1c1c1c]"}`}
        >
          <div className="w-[30px] h-[30px] bg-blue-600  rounded flex items-center justify-center mr-3">
            <SquarePen size={18} className="text-white" />
          </div>
          Resumen
        </Link>

        <div className="pt-4 border-t border-[#2a2a2a] mt-4">
            {isAuthenticated && (
              <>
                <Link
                to="/campaign-start-here"
                className={`flex items-center px-4 py-3 rounded-xl font-semibold text-base transition-colors text-white ${activeItem === "start-here" ? "bg-[#1c1c1c]" : "hover:bg-[#1c1c1c]"}`}
                >
                <div className="w-[30px] h-[30px] bg-blue-600 rounded flex items-center justify-center mr-3">
                  <MapPin size={18} className="text-white" />
                </div>
                COMIENZA AQUI
                </Link>

                <Link
                to="/campaign-rewards"
                className={`flex items-center px-4 py-3 rounded-xl font-semibold text-base transition-colors text-white ${activeItem === "rewards" ? "bg-[#1c1c1c]" : "hover:bg-[#1c1c1c]"}`}
                >
                <div className="w-[30px] h-[30px] bg-blue-600 rounded flex items-center justify-center mr-3">
                  <Medal size={18} className="text-white" />
                </div>
                RECOMPENSAS
                </Link>

                <Link
                to="/campaign-videos"
                className={`flex items-center px-4 py-3 rounded-xl font-semibold text-base transition-colors text-white ${activeItem === "videos" ? "bg-[#1c1c1c]" : "hover:bg-[#1c1c1c]"}`}
                >
                <div className="w-[30px] h-[30px] bg-blue-600 rounded flex items-center justify-center mr-3">
                  <Video size={18} className="text-white" />
                </div>
                MIS VIDEOS
                </Link>

                <Link
                to="/campaign-ads"
                className={`flex items-center px-4 py-3 rounded-xl font-semibold text-base transition-colors text-white ${activeItem === "ads" ? "bg-[#1c1c1c]" : "hover:bg-[#1c1c1c]"}`}
                >
                <div className="w-[30px] h-[30px] bg-blue-600  rounded flex items-center justify-center mr-3">
                  <BarChart2 size={18} className="text-white" />
                </div>
                ANUNCIOS
                </Link>
              </>
            )}
        </div>
      </nav>
    </aside>
  )
}
