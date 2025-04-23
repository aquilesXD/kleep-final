import { useState, useEffect } from "react";
import { ArrowLeft, Heart, MessageSquare, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { CampaignSidebar } from "../layout/CampainSidebar";
import Sidebar from "../layout/Sidebar";

// Interfaces para los datos
interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    isVerified?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  liked?: boolean;
}

// Post principal
interface MainPost {
  author: {
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  timestamp: string;
  title: string;
  content: string[];
  reactions: {
    likes: number;
    comments: number;
    views: number;
  };
}

// Componente de contenido de anuncios
const AnnouncementContent = () => {
  const [newComment, setNewComment] = useState("");

  // Datos del post principal
  const mainPost: MainPost = {
    author: {
      name: "Autopilot Support",
      avatar: "https://i.pravatar.cc/100?img=60",
      isVerified: true
    },
    timestamp: "3 days ago",
    title: "How to get paid twice for every video",
    content: [
      "Mucha gente nos ha pedido que recuperemos Instagram.",
      "Me complace anunciar que hemos recuperado oficialmente Instagram como una opción para nuestra campaña de recompensa de contenido!",
      "Lo que esto significa es que cada video que hagas se puede subir tanto a TikTok como a Instagram para que te paguen dos veces!",
      "(&  eso sin contar el pago mensual de $250 que recibes si publicas 2 videos por día en TikTok & IG!)",
      "Cada vídeo UGC tarda unos 3 minutos en realizarse, así que entra en acción ASAP!"
    ],
    reactions: {
      likes: 14,
      comments: 3,
      views: 576
    }
  };

  // Datos de los comentarios
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: {
        name: "Abdurraheem",
        avatar: "https://i.pravatar.cc/100?img=67"
      },
      content: "Puedo recibir pagos en paypal",
      timestamp: "9 hours ago",
      likes: 0
    },
    {
      id: "2",
      author: {
        name: "gnzdp",
        avatar: "https://i.pravatar.cc/100?img=33"
      },
      content: "Gracias, también ¿podrías ver mis clips más recientes en tiktok",
      timestamp: "3 days ago",
      likes: 0
    }
  ]);

  // Maneja la reacción (like) en un comentario
  const handleLike = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        const wasLiked = comment.liked || false;
        return {
          ...comment,
          likes: wasLiked ? comment.likes - 1 : comment.likes + 1,
          liked: !wasLiked
        };
      }
      return comment;
    }));
  };

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
              Post Details
            </div>

            <div className="w-[60px]">
              {/* Elemento vacío para mantener el centrado */}
            </div>
          </div>

          {/* Post principal */}
          <div className="border-b border-[#1a1a1a] p-4">
            {/* Autor y fecha */}
            <div className="flex items-start mb-3">
              <div className="mr-3 flex-shrink-0">
                <img
                  src={mainPost.author.avatar}
                  alt={mainPost.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center">
                  <span className="font-medium text-white text-[15px]">
                    {mainPost.author.name}
                  </span>
                  {mainPost.author.isVerified && (
                    <span className="ml-1 bg-blue-600 text-white text-xs px-0.5 rounded">A</span>
                  )}
                </div>
                <span className="text-gray-500 text-xs">{mainPost.timestamp}</span>
              </div>
            </div>

            {/* Título y contenido */}
            <h2 className="text-xl font-bold text-white mb-3">{mainPost.title}</h2>

            <div className="space-y-3 mb-5">
              {mainPost.content.map((paragraph, index) => (
                <p key={index} className="text-gray-200 text-sm leading-relaxed">{paragraph}</p>
              ))}
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
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                  </div>
                  <span className="text-white text-xs ml-1.5">{mainPost.reactions.likes}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-400 text-xs">
                <div className="flex items-center">
                  <MessageSquare size={14} className="mr-1" />
                  <span>{mainPost.reactions.comments}</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 mr-1">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                  </svg>
                  <span>{mainPost.reactions.views}</span>
                </div>
              </div>
            </div>

            {/* Acciones del post */}
            <div className="flex border-t border-[#222] pt-2.5">
              <button className="flex-1 flex items-center justify-center py-2 text-gray-400 hover:bg-[#191919] rounded-md transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2">
                  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
                <span className="text-sm">Reaccionar</span>
              </button>

              <button className="flex-1 flex items-center justify-center py-2 text-gray-400 hover:bg-[#191919] rounded-md transition-colors">
                <MessageSquare size={18} className="mr-2" />
                <span className="text-sm">Comentario</span>
              </button>

              <button className="flex-1 flex items-center justify-center py-2 text-gray-400 hover:bg-[#191919] rounded-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span className="text-sm">Compartir</span>
              </button>
            </div>
          </div>

          {/* Campo de entrada para nuevo comentario */}
          <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center">
            <button className="w-8 h-8 flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
              <span className="text-lg">+</span>
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Write something ..."
                className="w-full bg-[#222] rounded-md px-4 py-2 text-sm text-gray-200 focus:outline-none"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M11.47 1.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1-1.06 1.06l-1.72-1.72V7.5h-1.5V4.06L9.53 5.78a.75.75 0 0 1-1.06-1.06l3-3ZM11.25 7.5V15a.75.75 0 0 0 1.5 0V7.5h3.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h3.75Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contador de comentarios */}
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-[#1a1a1a]">
            {comments.length} comments
          </div>

          {/* Lista de comentarios */}
          <div>
            {comments.map((comment) => (
              <div key={comment.id} className="px-4 py-3 border-b border-[#1a1a1a]">
                <div className="flex">
                  {/* Avatar */}
                  <div className="mr-3 flex-shrink-0 mt-0.5">
                    {typeof comment.author.avatar === 'string' && comment.author.avatar.startsWith('http') ? (
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#303030] flex items-center justify-center text-white font-semibold">
                        {comment.author.avatar}
                      </div>
                    )}
                  </div>

                  {/* Contenido y reacciones */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-white text-xs">
                        {comment.author.name}
                      </span>
                      <span className="text-gray-500 text-[10px]">{comment.timestamp}</span>
                    </div>
                    <p className="text-gray-200 mt-1 text-xs">{comment.content}</p>

                    {/* Botones de reacción para comentarios */}
                    <div className="flex mt-2 space-x-5">
                      <button
                        className={`flex items-center ${comment.liked ? 'text-red-500' : 'text-gray-500'}`}
                        onClick={() => handleLike(comment.id)}
                      >
                        <Heart size={12} fill={comment.liked ? "currentColor" : "none"} className="mr-1" />
                        <span className="text-[10px]">{comment.likes > 0 ? comment.likes : ""}</span>
                      </button>

                      <button className="flex items-center text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                        <span className="text-[10px]">Reaccionar</span>
                      </button>

                      <button className="flex items-center text-gray-500">
                        <MessageSquare size={12} className="mr-1" />
                        <span className="text-[10px]">Responder</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export function CampaignAds() {
  const navigate = useNavigate();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const userEmail = localStorage.getItem("userEmail");

    // Verificar que tanto isAuthenticated como userEmail existan
    if (!isAuthenticated || !userEmail) {
      // Limpiar cualquier dato de sesión parcial
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("apiResponse");

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
