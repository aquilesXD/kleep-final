"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CampaignSidebar } from "../layout/CampainSidebar";
import Sidebar from "../layout/Sidebar";
import { toast } from 'react-hot-toast';


export default function CampaignRewards() {
  const [videoLink, setVideoLink] = useState("")
  const navigate = useNavigate()

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const userEmail = localStorage.getItem("userEmail")

    // Verificar que tanto isAuthenticated como userEmail existan
    if (!isAuthenticated || !userEmail) {
      // Limpiar cualquier dato de sesión parcial
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("apiResponse")

      // Redirigir al inicio de sesión
      navigate("/signin")
    }
  }, [navigate])

  const handleSubmit = () => {
    // Aquí iría la lógica para enviar el enlace del video
    console.log("Submitting video link:", videoLink);
    // Mostrar algún tipo de confirmación o feedback
    if (videoLink) {
      toast.success("Enlace de vídeo enviado correctamente!");
      setVideoLink("");
    } else {
      toast.error("Por favor ingrese un enlace de video válido.");
    }
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Sidebar />
      <div className="pl-20 lg:pl-24">
        <div className="flex flex-col lg:flex-row">
          <CampaignSidebar activeItem="rewards" />
          <main className="flex-1 p-4 lg:p-6">
            <div className="max-w-4xl mx-auto">
              {/* Alerta amarilla */}
              <div className="bg-[#fffbd6] text-[#73682b] p-4 rounded-lg mb-6">
                <p className="text-sm">Envíe su publicación para revisión dentro de 1 hora de su publicación para comenzar a recibir pagos</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* PAID OUT */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-400 text-sm uppercase font-medium">PAGADO</h3>
                    <span className="text-white text-sm">1%</span>
                  </div>
                  <p className="text-white text-sm">$13,45 de $10,000 pagados</p>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: "1%" }}></div>
                  </div>
                </div>

                {/* TIME LEFT */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-400 text-sm uppercase font-medium">TIEMPO RESTANTE</h3>
                    <span className="text-white text-sm">38%</span>
                  </div>
                  <p className="text-white text-sm">quedan 56 días</p>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: "38%" }}></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* REWARD */}
                <div>
                  <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">RECOMPENSAS</h3>
                  <div className="bg-blue-600 text-white text-sm font-medium py-1.5 px-3 rounded-md inline-block">
                    4.00 US$ / 1 mil
                  </div>
                </div>

                {/* CONTENT TYPE */}
                <div>
                  <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">TIPO DE CONTENIDO</h3>
                  <div className="bg-gray-800 text-white text-sm py-1.5 px-3 rounded-md inline-block">
                    Clipping
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* MAX PAID OUT */}
                <div>
                  <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">MÁXIMO PAGADO</h3>
                  <div className="bg-gray-800 text-white text-sm py-1.5 px-3 rounded-md inline-block">
                    $ 500
                  </div>
                </div>

                {/* CATEGORY */}
                <div>
                  <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">CATEGORIA</h3>
                  <div className="bg-gray-800 text-white text-sm py-1.5 px-3 rounded-md inline-block">
                    Creator
                  </div>
                </div>
              </div>

              {/* PLATFORMS */}
              <div className="mb-6">
                <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">PLATAFORMAS</h3>
                <div className="flex">
                  <div className="text-white text-xl">
                    <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
                      <path d="M22.02 7.364v3.586c-.6-.064-1.2-.107-1.793-.107-.8 0-1.585.107-2.328.32-1.143.32-2.157.898-2.993 1.66V7.257v-4.45h-4.014v16.709c0 .064 0 .135.007.199h-4.078a2.505 2.505 0 0 1 .078-.606V2.807H2.878v17.643c0 1.902 1.528 3.437 3.407 3.437h12.214c1.88 0 3.407-1.535 3.407-3.437v-4.31a3.428 3.428 0 0 0-.235-1.251 3.34 3.34 0 0 0-.663-1.067 6.294 6.294 0 0 1 3.236-1.137v.021c-.086-1.2-.707-2.264-1.614-2.928.935-.67 1.557-1.75 1.65-2.978.014-.142.021-.285.021-.435H22.02Z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* REQUIREMENTS */}
              <div className="mb-6">
                <h3 className="text-gray-400 text-xs uppercase font-medium mb-2">REQUIRIMIENTOS</h3>
                <div className="space-y-2">
                  <div className="bg-gray-800 text-white text-sm py-2 px-3 rounded-md">
                    Análisis de audiencia objetivo (edad, intereses, ubicación)
                  </div>
                  <div className="bg-gray-800 text-white text-sm py-2 px-3 rounded-md">
                    Elección del formato de anuncio (In-Feed, TopView, Branded Hashtag, Spark Ads)
                  </div>
                  <div className="bg-gray-800 text-white text-sm py-2 px-3 rounded-md">
                    Uso de efectos y sonidos populares
                  </div>
                  <div className="bg-gray-800 text-white text-sm py-2 px-3 rounded-md">
                    Incrementar conversiones (ventas, registros, descargas, etc.)
                  </div>
                </div>
              </div>

              {/* Submit section */}
              <div className="mt-8">
                <h2 className="text-white text-xl font-semibold mb-2">Envíe su publicación de video en las redes sociales</h2>
                <p className="text-gray-400 text-sm mb-4">Comparte el enlace de tu publicación a continuación.</p>

                <div className="mb-4">
                  <label htmlFor="videoLink" className="block text-gray-400 text-sm mb-2">Proporcionar enlance</label>
                  <input
                    type="text"
                    id="videoLink"
                    placeholder="https://"
                    className="w-full p-3 rounded-md bg-[#111] border border-[#333] text-white text-sm focus:outline-none focus:border-blue-500"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                  />
                </div>

                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-md transition"
                  onClick={handleSubmit}
                >
                  Enviar
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
