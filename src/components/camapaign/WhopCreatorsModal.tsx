import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { WaitlistFormModal } from './WaitlistFormModal';
import { useNavigate } from 'react-router-dom';

interface WhopCreatorsModalProps {
  onClose: () => void;
  reward: {
    id: number;
    avatar: string;
    creator: string;
    title: string;
    paidAmount: string;
    totalAmount: string;
    percentage: number;
    type: string;
    platform: string;
    rate: string;
    specialStyle?: boolean;
    image?: string;
  };
}

const WhopCreatorsModal = ({ onClose, reward }: WhopCreatorsModalProps) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const imageUrl = reward?.image ?? reward.avatar ?? 'https://picsum.photos/800/300?random=1';
  const navigate = useNavigate();

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const userEmail = localStorage.getItem("userEmail");
    setIsAuthenticated(Boolean(authStatus && userEmail));
  }, []);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  const handleViewDetails = () => {
    onClose();
    navigate('/campaign');
  };

  const handleJoinCampaign = () => {
    if (isAuthenticated) {
      // Si está autenticado, muestra el modal de unirse
      setShowJoinModal(true);
    } else {
      // Si no está autenticado, guarda el ID de la campaña y redirige al login
      localStorage.setItem('pendingCampaignJoin', reward.id.toString());
      onClose();
      navigate('/signin');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="relative bg-[#0c0c0c] border border-[#1c1c1c] rounded-lg w-full max-w-2xl p-6 text-white mx-4">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-white z-50"
          >
            <X size={24} />
          </button>

          <div className="aspect-video w-full rounded-md overflow-hidden mb-4 relative">
            <img
              src={imageUrl}
              alt={reward.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{reward.title}</h2>
            <p className="text-sm text-gray-400">Creado por <span className="text-white">{reward.creator}</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Recompensa por 1K visitas</p>
              <p className="text-xl font-semibold text-green-400">{reward.rate} USD</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Tipo de campaña</p>
              <p className="text-xl font-semibold text-white">{reward.type}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-1">Progreso del presupuesto</p>
            <p className="text-sm mb-2">
              {formatCurrency(reward.paidAmount)} de {formatCurrency(reward.totalAmount)} gastado
            </p>
            <div className="h-2 w-full bg-[#1c1c1c] rounded-full overflow-hidden mb-2">
              <div
                className="bg-orange-500 h-full"
                style={{ width: `${reward.percentage}%` }}
              />
            </div>
            <p className="text-xs text-right text-gray-500">
              Progreso: {reward.percentage}%
            </p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-1">Plataformas</p>
            <div className="flex items-center gap-2">
              {reward.platform.toLowerCase().includes('tiktok') && (
                <div className="bg-[#1c1c1c] p-2 rounded-md">
                  <img
                    src="https://assets.whop.com/core/2afe54ae8a904906b22dfce0/_next/static/media/tiktok-logo.b77808fb.svg"
                    alt="TikTok"
                    className="h-6"
                  />
                </div>
              )}
              {reward.platform.toLowerCase().includes('instagram') && (
                <div className="bg-[#1c1c1c] p-2 rounded-md">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
              )}
              {reward.platform.toLowerCase().includes('youtube') && (
                <div className="bg-[#1c1c1c] p-2 rounded-md">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#ff0000">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-1 gap-3">
            <button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded"
              onClick={handleJoinCampaign}
            >
              Unirse a esta campaña
            </button>
            
            <button
              onClick={handleViewDetails}
              className="w-full bg-[#1c1c1c] hover:bg-[#252525] text-white font-medium py-3 px-4 rounded flex items-center justify-center gap-2"
            >
              Ver detalles completos
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5l6 6m0 0l-6 6m6-6H3"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de formulario de espera */}
      {showJoinModal && (
        <WaitlistFormModal onClose={() => setShowJoinModal(false)} reward={{ title: reward.title }} />
      )}
    </>
  );
};

export default WhopCreatorsModal;
