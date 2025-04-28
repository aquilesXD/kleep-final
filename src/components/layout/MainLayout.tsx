import { useState } from 'react';
import Sidebar from './Sidebar'; // Asegúrate que la ruta de importación sea correcta

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#191919] text-white">
      
        <Sidebar /> {/* El Sidebar es fixed w-16 */}
      
      <div className="flex-1 ml-16 py-4 px-4 md:px-8"> {/* <-- Margen izquierdo fijo ml-16 */}
        {children}
      </div>
    </div>
  );
}