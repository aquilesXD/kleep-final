import { CampaignSidebar } from "../layout/CampainSidebar";
import Sidebar from "../layout/Sidebar";


export default function CampaignStartHere() {
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
                    src="https://img-v2-prod.whop.com/X6k_ozpYUY84nlanH6CyRTIRRP3VFwbJ0w593iHJm1o/rs:fill:80:80/el:1/dpr:2/aHR0cHM6Ly9hc3NldHMud2hvcC5jb20vdXBsb2Fkcy8yMDI1LTAzLTA2L3VzZXJfMjE3MzE2OF8wZjZiNjBkOS0zYTNiLTRjNjMtOTAxMS1lN2ZmMTE5ZGY5Y2IucG5n"
                    alt="START HERE icon"
                    className="h-8 w-8 rounded mr-3"
                  />
                  <p className="text-xl font-medium text-white mb-0">COMIENZA AQUI</p>
                </div>
              </div>

              <div className="card-body py-0 px-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="col-span-1 md:col-span-7 text-justify">
                    <h1 className="text-3xl text-white mb-4">📣¿Qué estamos promocionando?</h1>
                    <div className="text-lg text-white">
                      <p>
                        ¿Listo para aprovechar los mejores descuentos del año? En [nombre de la tienda] queremos premiar
                        tu preferencia con una oferta increíble: hasta un 50% de descuento en una amplia selección de
                        productos. 🛍️ Desde moda y accesorios hasta tecnología y artículos para el hogar, esta es tu
                        oportunidad de renovar tu estilo, mejorar tu espacio y consentirte con lo que más te gusta a
                        precios inigualables.
                      </p>
                      <p>
                        Además, para hacer tu experiencia de compra aún mejor, te ofrecemos envío gratis en compras
                        mayores a $50 y opciones de pago flexibles para que no te quedes sin lo que necesitas. Pero eso
                        no es todo, porque también contamos con promociones exclusivas para nuestros clientes frecuentes
                        y sorpresas especiales en cada compra. 🎁✨
                      </p>
                      <p>
                        ¡No dejes pasar esta oportunidad! Esta promoción es válida solo hasta el domingo, así que corre
                        a nuestra tienda física o visita nuestro sitio web para aprovechar estos descuentos imperdibles.
                        🔥 ¡Compra ahora y ahorra como nunca antes! 🚀
                      </p>
                    </div>

                    <div className="text-lg text-white mt-6">
                      <h3 className="text-2xl mb-3">📌 Generales:</h3>
                      <ul className="list-none pl-0">
                        <li className="mb-2">🏷️ Definir los productos o servicios en promoción.</li>
                        <li className="mb-2">📅 Establecer la fecha de inicio y finalización de la promoción.</li>
                        <li className="mb-2">🌍 Indicar si la promoción es válida en tienda física, online o ambas.</li>
                      </ul>

                      <h3 className="text-2xl mb-3 mt-5">📌 Condiciones y Restricciones:</h3>
                      <ul className="list-none pl-0">
                        <li className="mb-2">
                          ⚖️ Asegurar que la promoción cumple con las normativas legales vigentes.
                        </li>
                        <li className="mb-2">❌ Establecer productos o servicios excluidos de la promoción.</li>
                        <li className="mb-2">
                          🛍️ Definir si aplica solo para clientes nuevos o también para los recurrentes.
                        </li>
                      </ul>

                      <h3 className="text-2xl mb-3 mt-5">📌 Evaluación y Seguimiento:</h3>
                      <ul className="list-none pl-0">
                        <li className="mb-2">📊 Monitorear el impacto de la promoción en ventas y tráfico web.</li>
                        <li className="mb-2">📝 Recopilar feedback de los clientes para mejorar futuras campañas.</li>
                        <li className="mb-2">📆 Preparar un informe final con métricas y resultados clave.</li>
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
  )
}
