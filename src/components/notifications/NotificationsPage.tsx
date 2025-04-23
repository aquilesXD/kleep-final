import { useState, useEffect, useCallback } from "react";
import { Cog, MessageSquare, Heart, Share2, User, Bell, Check } from "lucide-react";
import { Link } from "react-router-dom";
import MainLayout from "../layout/MainLayout";


// Tipos de datos para las notificaciones
interface Notification {
  id: string;
  type: 'mention' | 'like' | 'follow' | 'share' | 'message' | 'system';
  user?: {
    name: string;
    avatar: string;
  };
  content: string;
  fullContent?: string;
  whopId?: string;
  timestamp: Date;
  read: boolean;
  date: 'today' | 'yesterday' | 'older';
}

// Función auxiliar para crear una fecha relativa (movida fuera del componente)
const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (hours < 1) return "Ahora";
  if (hours < 24) return `Hoy, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
  if (hours < 48) return `Ayer, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;

  return `${date.toLocaleDateString()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
};

// Datos de ejemplo para las notificaciones que se asemejan más a la captura de pantalla
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'mention',
    user: {
      name: 'Azan',
      avatar: 'https://i.pravatar.cc/100?u=azan1',
    },
    content: '@everyone dando $5 al final del día a la persona más útil. -puedes ayudar a otros, -guiarlos -dar consejos -señalar estafadores y etc etc etc',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 2, 29)),
    date: 'today',
    read: false,
  },
  {
    id: '2',
    type: 'mention',
    user: {
      name: 'Azan',
      avatar: 'https://i.pravatar.cc/100?u=azan1',
    },
    content: '@everyone dando $5 al final del día a la persona más útil. -puedes ayudar a otros, -guiarlos -dar consejos -señalar estafadores y etc etc etc',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 3, 44)),
    date: 'today',
    read: false,
  },
  {
    id: '3',
    type: 'mention',
    user: {
      name: 'Azan',
      avatar: 'https://i.pravatar.cc/100?u=azan1',
    },
    content: '@everyone si alguien quiere unirse a nuestra comunidad de pago... Aquí hay otras cosas que vamos a ofrecer: - Ofertas exclusivas - Llamadas 1-1 con Maxim - Todo sobre cómo comenzar la cuenta y',
    fullContent: '@everyone si alguien quiere unirse a nuestra comunidad de pago... Aquí hay otras cosas que vamos a ofrecer: - Ofertas exclusivas - Llamadas 1-1 con Maxim - Todo sobre cómo comenzar la cuenta y más',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 4, 36)),
    date: 'today',
    read: false,
  },
  {
    id: '4',
    type: 'mention',
    user: {
      name: 'Azan',
      avatar: 'https://i.pravatar.cc/100?u=azan1',
    },
    content: '@everyone dando $5 al final del día a la persona más útil. -puedes ayudar a otros, -guiarlos -dar consejos y etc etc etc',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 5, 24)),
    date: 'today',
    read: false,
  },
  {
    id: '5',
    type: 'mention',
    user: {
      name: 'Azan',
      avatar: 'https://i.pravatar.cc/100?u=azan1',
    },
    content: '@everyone dando $5 al final del día a la persona más útil. -puedes ayudar a otros, -guiarlos -dar consejos y etc etc etc',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 6, 18)),
    date: 'today',
    read: false,
  },
  {
    id: '6',
    type: 'mention',
    user: {
      name: 'Azan',
      avatar: 'https://i.pravatar.cc/100?u=azan1',
    },
    content: 'Oye @everyone ¿quién querría un sorteo para la persona más útil de la semana/mes? Como ayudar a otros y señalar estafadores etc',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 12, 10)),
    date: 'today',
    read: false,
  },
  {
    id: '7',
    type: 'mention',
    user: {
      name: 'Azan',
      avatar: 'https://i.pravatar.cc/100?u=azan1',
    },
    content: '@everyone tuvimos una llamada increíble en nuestro whop de pago, ¡y esto es solo el comienzo de lo que tenemos preparado! 🔥 Si aún no te has unido... Aquí hay otras cosas que vamos a ofrecer: - Exclu',
    fullContent: '@everyone tuvimos una llamada increíble en nuestro whop de pago, ¡y esto es solo el comienzo de lo que tenemos preparado! 🔥 Si aún no te has unido... Aquí hay otras cosas que vamos a ofrecer: - Ofertas exclusivas y más',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 14, 38)),
    date: 'today',
    read: false,
  },
  {
    id: '8',
    type: 'mention',
    user: {
      name: 'eric',
      avatar: 'https://i.pravatar.cc/100?u=eric1',
    },
    content: '@everyone ¿quién está trabajando en whop ahora? quiero recompensar a algunos de los más trabajadores 🤑',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 34, 23)),
    date: 'yesterday',
    read: false,
  },
  {
    id: '9',
    type: 'mention',
    user: {
      name: 'Azan',
      avatar: 'https://i.pravatar.cc/100?u=azan1',
    },
    content: '@everyone tuvimos una llamada increíble en nuestro whop de pago, ¡y esto es solo el comienzo de lo que tenemos preparado! 🔥 Si aún no te has unido... Aquí hay otras cosas que vamos a ofrecer: - Exclu',
    fullContent: '@everyone tuvimos una llamada increíble en nuestro whop de pago, ¡y esto es solo el comienzo de lo que tenemos preparado! 🔥 Si aún no te has unido... Aquí hay otras cosas que vamos a ofrecer: - Ofertas exclusivas y más',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 36, 1)),
    date: 'yesterday',
    read: false,
  },
];

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [groupedNotifications, setGroupedNotifications] = useState<{[key: string]: Notification[]}>({});
  const [showReadFeedback, setShowReadFeedback] = useState(false);

  // Agrupar notificaciones por fecha
  useEffect(() => {
    const grouped = notifications.reduce((acc, notification) => {
      const key = notification.date;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(notification);
      return acc;
    }, {} as {[key: string]: Notification[]});

    setGroupedNotifications(grouped);
  }, [notifications]);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setShowReadFeedback(true);
    setTimeout(() => setShowReadFeedback(false), 2000);
  }, []);

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    // Aquí se puede agregar la lógica para mostrar el contenido completo o navegar
  }, [handleMarkAsRead]);

  return (
    <MainLayout>
      <div className="flex flex-col w-full h-full min-h-screen bg-[#121212] text-white">
        {/* Header Principal */}
        <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#1c1c1c] px-4 py-3">
          <h1 className="text-xl font-bold">Notificaciones</h1>
        </div>

        {/* Barra de navegación simplificada */}
        <div className="sticky top-14 z-10 bg-[#121212] border-b border-[#1c1c1c] px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex">
              <span className="px-4 py-2 text-sm font-medium text-white">
                Toda la actividad
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {showReadFeedback && (
                <span className="text-sm text-green-500 mr-2">
                  Todas las notificaciones marcadas como leídas
                </span>
              )}
              <button
                onClick={handleMarkAllAsRead}
                className="px-3 py-1.5 rounded-md bg-transparent border border-[#333] hover:bg-[#1a1a1a] text-white text-sm transition-colors flex items-center"
              >
                <span>Marcar todo como leído</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="flex-1">
          {Object.entries(groupedNotifications).map(([date, notifications]) => (
            <div key={date} className="border-b border-[#1c1c1c]">
              {/* Encabezado de fecha */}
              {date !== 'older' && (
                <div className="py-1 px-4 text-xs text-gray-500 uppercase bg-[#0f0f0f]">
                  {date === 'today' ? 'Hoy' : date === 'yesterday' ? 'Ayer' : date}
                </div>
              )}

              {/* Lista de notificaciones */}
              <div className="divide-y divide-[#1c1c1c]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="px-4 py-3 flex items-start">
                      {/* Punto de notificación */}
                      <div className="mt-[14px] mr-3 min-w-[8px]">
                        {!notification.read && (
                          <div className="w-[8px] h-[8px] bg-[#2563eb] rounded-full"></div>
                        )}
                      </div>

                      {/* Avatar */}
                      <img
                        src={notification.user?.avatar}
                        alt={`Avatar de ${notification.user?.name}`}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />

                      {/* Contenido */}
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm">
                            {notification.user?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getRelativeTimeString(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          {notification.fullContent || notification.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Estado vacío */}
          {Object.keys(groupedNotifications).length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 p-6">
              <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                <Bell className="text-gray-500" size={24} />
              </div>
              <h2 className="text-lg font-medium text-white mb-2">
                No hay notificaciones
              </h2>
              <p className="text-gray-400 text-center text-sm max-w-md">
                No tienes notificaciones actualmente
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
