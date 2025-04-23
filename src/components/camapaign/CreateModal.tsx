"use client"

import type React from "react"

import { useState } from "react"
import {
  X,
  Search,
  Radio,
  Megaphone,
  Gift,
  BarChart3,
  MessageSquare,
  Calendar,
  BookOpen,
  FileText,
  FileCode,
  MonitorSmartphone,
} from "lucide-react"

interface CreateOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  if (!isOpen) return null

  const createOptions: CreateOption[] = [
    {
      id: "live",
      title: "Transmisión en directo",
      description: "Actúe en directo, interactúe en tiempo real y comparta contenidos exclusivos",
      icon: <Radio className="h-5 w-5" />,
      color: "bg-red-500",
    },
    {
      id: "publish",
      title: "Publicar en",
      description: "Haga anuncios, publique un boletín o comparta actualizaciones importantes.",
      icon: <Megaphone className="h-5 w-5" />,
      color: "bg-orange-500",
    },
    {
      id: "bounty",
      title: "Bounty",
      description: "Publica tareas y paga a tus usuarios por completarlas",
      icon: <Gift className="h-5 w-5" />,
      color: "bg-yellow-500",
    },
    {
      id: "reward",
      title: "Recompensa por contenido",
      description: "Aumente el alcance, pague por las visitas y escale con su audiencia",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "bg-green-500",
    },
    {
      id: "chat",
      title: "Mensaje de chat",
      description: "Chatea al instante, comparte contenido multimedia y mantente conectado",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "bg-orange-500",
    },
    {
      id: "event",
      title: "Evento",
      description: "Vender acceso a eventos virtuales o presenciales",
      icon: <Calendar className="h-5 w-5" />,
      color: "bg-red-400",
    },
    {
      id: "course",
      title: "Curso",
      description: "Compartir conocimientos con lecciones de vídeo y texto",
      icon: <BookOpen className="h-5 w-5" />,
      color: "bg-purple-500",
    },
    {
      id: "files",
      title: "Archivos",
      description: "Añade archivos exclusivos como PDF, plantillas y mucho más",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    {
      id: "document",
      title: "Documento",
      description: "Escribir contenido enriquecido de formato largo, como una guía",
      icon: <FileCode className="h-5 w-5" />,
      color: "bg-purple-400",
    },
    {
      id: "software",
      title: "Software",
      description: "Venda acceso a su software descargable y pórtelo mediante claves de licencia",
      icon: <MonitorSmartphone className="h-5 w-5" />,
      color: "bg-blue-400",
    },
  ]

  const filteredOptions = searchQuery
    ? createOptions.filter(
        (option) =>
          option.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          option.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : createOptions

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 flex justify-between items-center border-b border-[#222222]">
          <h2 className="text-xl font-bold text-white">¿Qué quiere crear?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar en..."
              className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg py-2 pl-10 pr-4 text-white text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredOptions.slice(0, 6).map((option) => (
              <div
                key={option.id}
                className="bg-[#1a1a1a] hover:bg-[#252525] rounded-lg p-4 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`${option.color} p-2 rounded-lg`}>{option.icon}</div>
                  <div>
                    <h3 className="font-medium text-white">{option.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredOptions.length > 6 && (
            <>
              <div className="mt-6 mb-3">
                <h3 className="text-sm font-medium text-gray-400">Contenido</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredOptions.slice(6).map((option) => (
                  <div
                    key={option.id}
                    className="bg-[#1a1a1a] hover:bg-[#252525] rounded-lg p-4 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${option.color} p-2 rounded-lg`}>{option.icon}</div>
                      <div>
                        <h3 className="font-medium text-white">{option.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

