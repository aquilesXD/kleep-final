import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  return (
    <div className="flex min-h-screen bg-[#191919] text-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={toggleMobileSidebar}
        className="md:hidden fixed top-4 left-4 z-40 bg-[#161616] p-2 rounded-md"
      >
        {showMobileSidebar ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Sidebar */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-[#191919] bg-opacity-50" onClick={toggleMobileSidebar}></div>
          <div className="absolute left-0 top-0 h-full w-64 bg-[#121212] border-r border-[#1c1c1c] p-4">
            <div className="flex justify-end">
              <button onClick={toggleMobileSidebar} className="p-2">
                <X size={20} />
              </button>
            </div>
            <div className="mt-8 py-4 flex flex-col space-y-1">
              {/* Menú móvil simplificado */}
              <a href="/inicio" className="px-4 py-2 hover:bg-[#1c1c1c] rounded-md">Inicio</a>
              <a href="/discover" className="px-4 py-2 hover:bg-[#1c1c1c] rounded-md">Explorar</a>
              <a href="/messages" className="px-4 py-2 hover:bg-[#1c1c1c] rounded-md">Mensajes</a>
              <a href="/notifications" className="px-4 py-2 bg-[#1c1c1c] rounded-md">Notificaciones</a>
              <a href="/dashboard" className="px-4 py-2 hover:bg-[#1c1c1c] rounded-md">Dashboard</a>
              <a href="/profile" className="px-4 py-2 hover:bg-[#1c1c1c] rounded-md">Perfil</a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-16 py-4 px-4 md:px-8">
        {children}
      </div>
    </div>
  );
}
