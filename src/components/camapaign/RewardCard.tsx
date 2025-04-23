"use client"

import { useState } from "react"
import WhopCreatorsModal from "./WhopCreatorsModal"

interface RewardCardProps {
  reward: {
    id: number
    avatar: string
    creator: string
    title: string
    paidAmount: string
    totalAmount: string
    percentage: number
    type: string
    platform: string
    rate: string
    specialStyle?: boolean
    views?: number
    earnings?: string
    status?: string
    isJoined?: boolean
  }
  showEarnings?: boolean
}

export function RewardCard({ reward, showEarnings = false }: RewardCardProps) {
  const [showModal, setShowModal] = useState(false)

  const handleCardClick = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  return (
    <>
      <div
        className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] cursor-pointer hover:border-[#3a3a3a] transition-colors relative"
        onClick={handleCardClick}
      >
        {reward.isJoined && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-900 text-green-400">
              Unido
            </span>
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-center mb-3">
            <div className="h-10 w-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
              <img
                src={reward.avatar || "/placeholder.svg"}
                alt={`${reward.creator} avatar`}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-white">{reward.creator}</p>
            </div>
            {showEarnings && reward.status && (
              <div className="ml-auto">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  reward.status === 'active' ? 'bg-green-900 text-green-400' : 
                  reward.status === 'pending' ? 'bg-yellow-900 text-yellow-400' : 
                  'bg-red-900 text-red-400'
                }`}>
                  {reward.status === 'active' ? 'Activa' : 
                   reward.status === 'pending' ? 'Pendiente' : 
                   'Pausada'}
                </span>
              </div>
            )}
          </div>

          <p className="text-white font-medium mb-3 hover:underline">{reward.title}</p>

          <div className="flex justify-between mb-1">
            <p className="text-sm text-white">
              {reward.paidAmount} US$ de {reward.totalAmount} US$ pagado
            </p>
            <p className="text-sm text-white">{reward.percentage}%</p>
          </div>

          <div className="h-3 w-full bg-[#121212] border border-[#2a2a2a] rounded mb-4">
            <div className="h-full bg-orange-500 rounded" style={{ width: `${reward.percentage}%` }}></div>
          </div>

          {showEarnings && reward.views !== undefined && reward.earnings !== undefined ? (
            <div className="mb-4 bg-[#222] p-3 rounded-lg border border-[#333]">
              <h4 className="text-xs font-bold text-gray-400 mb-2">Tus Estadísticas</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">Vistas</p>
                  <p className="text-sm text-white">{reward.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">Ganancias</p>
                  <p className="text-sm text-green-400">{reward.earnings} US$</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs font-bold text-gray-400 mb-1">Tipo</p>
              <p className="text-sm text-white">{reward.type}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 mb-1">Plataformas</p>
              <img
                src="https://assets.whop.com/core/2afe54ae8a904906b22dfce0/_next/static/media/tiktok-logo.b77808fb.svg"
                alt="TikTok"
                className="h-5"
              />
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 mb-1">$ / Vistas</p>
              {reward.specialStyle ? (
                <div className="bg-indigo-600 text-white text-xs font-semibold py-1 px-2 rounded">
                  {reward.rate} US$ / 1 mil
                </div>
              ) : (
                <div className="bg-gradient-to-b from-[#1754D8] to-[#578CFF] text-white text-xs font-semibold py-1 px-2 rounded border border-[#2862e2]">
                  {reward.rate} US$ / <span className="opacity-60">1 mil</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && <WhopCreatorsModal reward={reward} onClose={handleCloseModal} />}
    </>
  )
}

