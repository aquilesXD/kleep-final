import { useState, useEffect } from "react";
import { ArrowLeft, Heart, MessageSquare, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { CampaignSidebar } from "../layout/CampainSidebar";
import Sidebar from "../layout/Sidebar";

// Interfaces para los datos
interface Comment {
  id: number;
  comment: string;
  created_at: string;
  parent_id: number | null;
  user_id: number;
  user_name: string;
  user_profile_image: string;
  liked?: boolean;
}

// Interfaz para anuncios
interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  user_id: number;
  user_name: string;
  user_profile_image: string;
  reactions_count: number;
  user_reacted: boolean;
  comments: Comment[];
}

// Interfaz para la respuesta de la API
interface ApiResponse {
  announcements: Announcement[];
}

// Get auth token from localStorage or sessionStorage
const getAuthToken = (): string => {
  return localStorage.getItem("authToken") || 
         localStorage.getItem("token") || 
         sessionStorage.getItem("authToken") || 
         sessionStorage.getItem("token") || 
         ""; // Devuelve cadena vacía si no encuentra token
};

// Componente de contenido de anuncios
const AnnouncementContent = () => {
  const { campaignId = "1" } = useParams<{ campaignId: string }>();
  const [newComment, setNewComment] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const navigate = useNavigate();

  // Obtener los anuncios desde la API
  useEffect(() => {
    let ignore = false;
    
    const fetchAnnouncements = async () => {
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
        let response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/announcements`, {
          headers: {
            'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        // Si el error es 401 (No autorizado), intentar con formatos alternativos
        if (response.status === 401) {
          // Intentar con formato alternativo (solo token sin Bearer)
          response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/announcements`, {
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          // Si sigue fallando, intentar con query param
          if (response.status === 401) {
            response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/announcements?api_token=${token}`, {
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
          throw new Error(`Error al cargar los anuncios (${response.status})`);
        }

        const data: ApiResponse = await response.json();
        
        // Verificar si debemos ignorar esta respuesta (componente desmontado)
        if (!ignore) {
          setAnnouncements(data.announcements);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
          setError(errorMessage);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchAnnouncements();
    
    // Limpieza al desmontar el componente
    return () => {
      ignore = true;
    };
  }, [campaignId]);

  // Maneja la reacción (like) en un anuncio
  const handleAnnouncementReaction = async (announcementId: number) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        setIsAuthError(true);
        throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
      }

      // Actualizar optimistamente la UI
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(announcement => {
          if (announcement.id === announcementId) {
            return {
              ...announcement,
              reactions_count: announcement.user_reacted 
                ? announcement.reactions_count - 1 
                : announcement.reactions_count + 1,
              user_reacted: !announcement.user_reacted
            };
          }
          return announcement;
        })
      );

      // Enviar la acción a la API
      const response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/announcements/${announcementId}/react`, {
        method: 'POST',
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Si la API falla, revertir el cambio optimista
        setAnnouncements(prevAnnouncements => 
          prevAnnouncements.map(announcement => {
            if (announcement.id === announcementId) {
              return {
                ...announcement,
                reactions_count: announcement.user_reacted 
                  ? announcement.reactions_count - 1 
                  : announcement.reactions_count + 1,
                user_reacted: !announcement.user_reacted
              };
            }
            return announcement;
          })
        );
        throw new Error(`Error al reaccionar al anuncio (${response.status})`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    }
  };

  // Maneja el envío de un nuevo comentario
  const handleAddComment = async (announcementId: number) => {
    const commentText = newComment.trim();
    
    if (!commentText) {
      return;
    }

    try {
      const token = getAuthToken();
      
      if (!token) {
        setIsAuthError(true);
        throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
      }

      const response = await fetch(`https://contabl.net/kleep/api/campaigns/${campaignId}/announcements/${announcementId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ content: commentText })
      });

      if (!response.ok) {
        throw new Error(`Error al enviar el comentario (${response.status})`);
      }

      const data = await response.json();
      
      // Actualizar los anuncios con el nuevo comentario
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(announcement => {
          if (announcement.id === announcementId) {
            return {
              ...announcement,
              comments: [...announcement.comments, data.comment]
            };
          }
          return announcement;
        })
      );

      // Limpiar el campo de comentario
      setNewComment("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    }
  };

  // Formatear fecha relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} segundos`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} días`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} meses`;
    return `${Math.floor(diffInSeconds / 31536000)} años`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
        <p className="text-white ml-4">Cargando anuncios...</p>
      </div>
    );
  }

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

  if (announcements.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="w-full border-b border-[#222] bg-[#121212]">
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="w-7 h-7 bg-[#2563eb] rounded flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M22 5H20L12 13L4 5H2"></path>
                <path d="M2 19L9 12"></path>
                <path d="M22 19L15 12"></path>
              </svg>
            </div>
            <span className="font-medium text-white">Anuncios</span>
          </div>
        </div>
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-400">No hay anuncios disponibles en este momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header con Announcements - Fuera del contenedor centrado */}
      <div className="w-full border-b border-[#222] bg-[#121212]">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="w-7 h-7 bg-[#2563eb] rounded flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M22 5H20L12 13L4 5H2"></path>
              <path d="M2 19L9 12"></path>
              <path d="M22 19L15 12"></path>
            </svg>
          </div>
          <span className="font-medium text-white">Anuncios</span>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[800px] bg-[#0c0c0c] text-white border-x border-[#222]">
          {/* Back y Post Details */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222] bg-[#121212]">
            <button className="flex items-center text-gray-300 hover:text-white">
              <ArrowLeft size={18} className="mr-2" />
              <span>Back</span>
            </button>

            <div className="text-base font-medium text-white">
              Anuncios de la Campaña
            </div>

            <div className="w-[60px]">
              {/* Elemento vacío para mantener el centrado */}
            </div>
          </div>

          {/* Lista de anuncios */}
          {announcements.map((announcement) => (
            <div key={announcement.id} className="border-b border-[#1a1a1a] p-4">
            {/* Autor y fecha */}
            <div className="flex items-start mb-3">
              <div className="mr-3 flex-shrink-0">
                <img
                    src={announcement.user_profile_image}
                    alt={announcement.user_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center">
                  <span className="font-medium text-white text-[15px]">
                      {announcement.user_name}
                  </span>
                    <span className="ml-1 bg-blue-600 text-white text-xs px-0.5 rounded">A</span>
                </div>
                  <span className="text-gray-500 text-xs">hace {formatRelativeTime(announcement.created_at)}</span>
              </div>
            </div>

            {/* Título y contenido */}
              <h2 className="text-xl font-bold text-white mb-3">{announcement.title}</h2>

            <div className="space-y-3 mb-5">
                <p className="text-gray-200 text-sm leading-relaxed">{announcement.content}</p>
            </div>

            {/* Reacciones y estadísticas */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="flex items-center bg-[#222] rounded-full px-2 py-0.5">
                  <div className="bg-red-500 p-0.5 rounded-full">
                    <Heart size={12} className="text-white" />
                  </div>
                  <div className="bg-[#eab308] p-0.5 rounded-full -ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1-2-2h3"></path>
                    </svg>
                  </div>
                    <span className="text-white text-xs ml-1.5">{announcement.reactions_count}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-400 text-xs">
                <div className="flex items-center">
                  <MessageSquare size={14} className="mr-1" />
                    <span>{announcement.comments.length}</span>
                </div>
              </div>
            </div>

            {/* Acciones del post */}
            <div className="flex border-t border-[#222] pt-2.5">
                <button 
                  className={`flex-1 flex items-center justify-center py-2 ${announcement.user_reacted ? 'text-blue-500' : 'text-gray-400'} hover:bg-[#191919] rounded-md transition-colors`}
                  onClick={() => handleAnnouncementReaction(announcement.id)}
                >
                <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2">
                    <path fill={announcement.user_reacted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1-2-2h3"></path>
                </svg>
                <span className="text-sm">Reaccionar</span>
              </button>

              <button className="flex-1 flex items-center justify-center py-2 text-gray-400 hover:bg-[#191919] rounded-md transition-colors">
                <MessageSquare size={18} className="mr-2" />
                <span className="text-sm">Comentario</span>
              </button>

              <button className="flex-1 flex items-center justify-center py-2 text-gray-400 hover:bg-[#191919] rounded-md transition-colors">
                  <Share2 size={18} className="mr-2" />
                <span className="text-sm">Compartir</span>
              </button>
          </div>

          {/* Campo de entrada para nuevo comentario */}
              <div className="px-0 py-3 flex items-center mt-2">
                <div className="w-8 h-8 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center text-white mr-3">
                  <span className="text-xs">YO</span>
                </div>
            <div className="flex-1 relative">
              <input
                type="text"
                    placeholder="Escribe un comentario..."
                className="w-full bg-[#222] rounded-md px-4 py-2 text-sm text-gray-200 focus:outline-none"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(announcement.id);
                      }
                    }}
              />
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
                    onClick={() => handleAddComment(announcement.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>

              {/* Lista de comentarios */}
              {announcement.comments.length > 0 && (
                <div className="mt-3">
                  <div className="px-0 py-2 text-xs text-gray-500">
                    {announcement.comments.length} comentarios
          </div>

          <div>
                    {announcement.comments.map((comment) => (
                      <div key={comment.id} className="py-3 border-t border-[#1a1a1a]">
                <div className="flex">
                  {/* Avatar */}
                  <div className="mr-3 flex-shrink-0 mt-0.5">
                      <img
                              src={comment.user_profile_image}
                              alt={comment.user_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                  </div>

                  {/* Contenido y reacciones */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-white text-xs">
                                {comment.user_name}
                      </span>
                              <span className="text-gray-500 text-[10px]">hace {formatRelativeTime(comment.created_at)}</span>
                    </div>
                            <p className="text-gray-200 mt-1 text-xs">{comment.comment}</p>

                            {/* Respuestas a este comentario (si las hay) */}
                            {announcement.comments
                              .filter(reply => reply.parent_id === comment.id)
                              .map(reply => (
                                <div key={reply.id} className="mt-2 pl-4 border-l border-[#333]">
                                  <div className="flex">
                                    <div className="mr-2 flex-shrink-0 mt-0.5">
                                      <img
                                        src={reply.user_profile_image}
                                        alt={reply.user_name}
                                        className="w-6 h-6 rounded-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <span className="font-medium text-white text-[10px]">
                                          {reply.user_name}
                                        </span>
                                        <span className="text-gray-500 text-[8px]">hace {formatRelativeTime(reply.created_at)}</span>
                                      </div>
                                      <p className="text-gray-200 mt-0.5 text-[10px]">{reply.comment}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export function CampaignAds() {
  const navigate = useNavigate();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = getAuthToken();

    // Verificar que exista un token
    if (!token) {
      // Redirigir al inicio de sesión
      navigate("/signin");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      <Sidebar />
      <div className="pl-20 lg:pl-24">
        <div className="flex flex-col lg:flex-row">
          <CampaignSidebar activeItem="ads" />
          <div className="flex-1 overflow-auto">
            <AnnouncementContent />
          </div>
        </div>
      </div>
    </div>
  );
}
