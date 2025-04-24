import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CampaignSidebar } from "../layout/CampainSidebar";
import Sidebar from "../layout/Sidebar";

// Interfaz para la respuesta de la API
interface ApiResponse {
  success: boolean;
  guide_content: string;
}

// Interfaz para los datos procesados de la guía
interface StartGuideData {
  icon: string;
  title: string;
  content: string;
  general_points: string[];
  conditions: string[];
  evaluation: string[];
}

// Get auth token from localStorage or sessionStorage
const getAuthToken = (): string => {
  return localStorage.getItem("authToken") || 
         localStorage.getItem("token") || 
         sessionStorage.getItem("authToken") || 
         sessionStorage.getItem("token") || 
         ""; // Devuelve cadena vacía si no encuentra token
};

export default function CampaignStartHere() {
  const { campaignId = "1" } = useParams<{ campaignId: string }>();
  const [guideData, setGuideData] = useState<StartGuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStartGuide = async () => {
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
        let response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/start`, {
          headers: {
            'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        // Si el error es 401 (No autorizado), es un problema de autenticación
        if (response.status === 401) {
          // Intentar con formato alternativo (solo token sin Bearer)
          response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/start`, {
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          // Si sigue fallando, intentar con query param
          if (response.status === 401) {
            response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/start?api_token=${token}`, {
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
          throw new Error(`Error al cargar la guía de inicio (${response.status})`);
        }

        const apiResponse: ApiResponse = await response.json();
        
        if (!apiResponse.success) {
          throw new Error('La API devolvió un estado de error');
        }

        // Por ahora solo tenemos guide_content en la respuesta
        // Podemos extraer los demás datos cuando estén disponibles
        setGuideData({
          icon: "https://img-v2-prod.whop.com/X6k_ozpYUY84nlanH6CyRTIRRP3VFwbJ0w593iHJm1o/rs:fill:80:80/el:1/dpr:2/aHR0cHM6Ly9hc3NldHMud2hvcC5jb20vdXBsb2Fkcy8yMDI1LTAzLTA2L3VzZXJfMjE3MzE2OF8wZjZiNjBkOS0zYTNiLTRjNjMtOTAxMS1lN2ZmMTE5ZGY5Y2IucG5n",
          title: "COMIENZA AQUI",
          content: apiResponse.guide_content,
          general_points: [
            "🏷️ Definir los productos o servicios en promoción.",
            "📅 Establecer la fecha de inicio y finalización de la promoción.",
            "🌍 Indicar si la promoción es válida en tienda física, online o ambas."
          ],
          conditions: [
            "⚖️ Asegurar que la promoción cumple con las normativas legales vigentes.",
            "❌ Establecer productos o servicios excluidos de la promoción.",
            "🛍️ Definir si aplica solo para clientes nuevos o también para los recurrentes."
          ],
          evaluation: [
            "📊 Monitorear el impacto de la promoción en ventas y tráfico web.",
            "📝 Recopilar feedback de los clientes para mejorar futuras campañas.",
            "📆 Preparar un informe final con métricas y resultados clave."
          ]
        });
        
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStartGuide();
  }, [campaignId, navigate]);

  // Mostrar mensaje de carga mientras se obtienen los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
        <p className="text-white ml-4">Cargando guía de inicio...</p>
      </div>
    );
  }

  // Mostrar mensaje de error si algo falla
  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center">
        <p className="text-red-500 text-xl">Error: {error}</p>
        
        {isAuthError ? (
          <button 
            onClick={() => navigate('/signin')} 
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md">
            Iniciar sesión
          </button>
        ) : (
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md">
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Sidebar />
      <div className="pl-20 lg:pl-24">
        <div className="flex flex-col lg:flex-row">
          <CampaignSidebar activeItem="start-here" />
          <main className="flex-1 p-4 lg:p-8">
            <div className="card border-0 bg-[#121212]">
              <div className="card-header mb-3 p-5">
                <div className="flex items-center">
                  <img
                    src={guideData?.icon}
                    alt="START HERE icon"
                    className="h-8 w-8 rounded mr-3"
                  />
                  <p className="text-xl font-medium text-white mb-0">{guideData?.title}</p>
                </div>
              </div>

              <div className="card-body py-0 px-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="col-span-1 md:col-span-7 text-justify">
                    <h1 className="text-3xl text-white mb-4">📣¿Qué estamos promocionando?</h1>
                    {guideData && (
                      <div className="text-lg text-white" dangerouslySetInnerHTML={{ __html: guideData.content }}></div>
                    )}

                    <div className="text-lg text-white mt-6">
                      <h3 className="text-2xl mb-3">📌 Generales:</h3>
                      <ul className="list-none pl-0">
                        {guideData?.general_points?.map((point, index) => (
                          <li key={index} className="mb-2">{point}</li>
                        ))}
                      </ul>

                      <h3 className="text-2xl mb-3 mt-5">📌 Condiciones y Restricciones:</h3>
                      <ul className="list-none pl-0">
                        {guideData?.conditions?.map((condition, index) => (
                          <li key={index} className="mb-2">{condition}</li>
                        ))}
                      </ul>

                      <h3 className="text-2xl mb-3 mt-5">📌 Evaluación y Seguimiento:</h3>
                      <ul className="list-none pl-0">
                        {guideData?.evaluation?.map((point, index) => (
                          <li key={index} className="mb-2">{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-4">{/* Right column content if needed */}</div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
