import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import tiktokVerificationService from '../../services/tiktokVerificationService';
import { toast } from 'react-hot-toast';

interface TikTokAccount {
  id: string;
  username: string;
  isVerified: boolean;
  verifiedStatus?: string;
  tiktok_code?: string;
  account_id?: string;
  verified_request?: string;
  verified_att?: number | undefined; // Contador de intentos (opcional, pero siempre número)
}

// Función para calcular el tiempo restante formateado
const getTimeRemaining = (timestamp: string): string => {
  const requestTime = new Date(timestamp).getTime();
  const now = new Date().getTime();
  const MAX_VERIFICATION_TIME_MS = 24 * 60 * 60 * 1000; // 24 horas

  const elapsedTime = now - requestTime;
  const remainingTime = MAX_VERIFICATION_TIME_MS - elapsedTime;

  // Si el tiempo expiró, no mostrar nada o mostrar un mensaje neutro
  if (remainingTime <= 0) return "";

  // Calcular horas y minutos restantes
  const hoursRemaining = Math.floor(remainingTime / (60 * 60 * 1000));
  const minutesRemaining = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

  if (hoursRemaining > 0) {
    return `${hoursRemaining}h ${minutesRemaining}m`;
  } else {
    return `${minutesRemaining} minutos`;
  }
};

const ProfileConnectedAccounts = () => {
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<TikTokAccount | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'warning' | 'info'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [lastVerificationTime, setLastVerificationTime] = useState<number | null>(null); // Nuevo estado para rastrear el tiempo del último intento
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // Tiempo restante para el próximo intento
  const [countdownInterval, setCountdownInterval] = useState<ReturnType<typeof setInterval> | null>(null); // Intervalo para la cuenta regresiva

  useEffect(() => {
    fetchTikTokAccounts();

    // Establecer un intervalo para verificar el estado de las cuentas pendientes cada 30 segundos
    const intervalId = setInterval(() => {
      if (accounts.some(acc => acc.verifiedStatus === 'pending')) {
        checkPendingAccountsStatus();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(intervalId);
  }, []);

  // Función para obtener las cuentas de TikTok
  const fetchTikTokAccounts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Obtener el ID de usuario
      const userId = await getUserId();
      if (!userId) {
        throw new Error('No se pudo determinar el ID de usuario');
      }

      // Obtener cuentas de TikTok usando el servicio
      const accountsData = await tiktokVerificationService.fetchTikTokAccounts(userId);
      setAccounts(accountsData);

      // Si hay cuentas pendientes, verificar su estado actual
      if (accountsData.some(acc => acc.verifiedStatus === 'pending')) {
        setTimeout(() => checkPendingAccountsStatus(), 1000);
      }
    } catch (error: any) {
      setError(`Error al cargar cuentas: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener el ID de usuario desde localStorage o API
  const getUserId = async (): Promise<string | null> => {
    const apiResponse = localStorage.getItem('apiResponse');
    if (!apiResponse) return null;

    try {
      const parsedResponse = JSON.parse(apiResponse);

      // Intentar encontrar el ID en diferentes ubicaciones de la respuesta
      if (parsedResponse.data && Array.isArray(parsedResponse.data) && parsedResponse.data.length > 0) {
        const firstItem = parsedResponse.data[0];
        if (firstItem.user_id) return firstItem.user_id;
        if (firstItem.id_user) return firstItem.id_user;
        if (firstItem.id) return firstItem.id;
      }

      if (parsedResponse.user_id) return parsedResponse.user_id;
      if (parsedResponse.id_user) return parsedResponse.id_user;
      if (parsedResponse.id) return parsedResponse.id;

      // Búsqueda recursiva
      const findUserId = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;

        for (const key in obj) {
          if ((key === 'id' || key === 'user_id' || key === 'id_user') &&
              (typeof obj[key] === 'string' || typeof obj[key] === 'number')) {
            return String(obj[key]);
          }

          if (typeof obj[key] === 'object') {
            const result = findUserId(obj[key]);
            if (result) return result;
          }
        }

        return null;
      };

      return findUserId(parsedResponse) || '1'; // Valor por defecto para pruebas
    } catch (e) {
      return null;
    }
  };

  // Verifica el estado actual de las cuentas pendientes
  const checkPendingAccountsStatus = async () => {
    if (isCheckingStatus || accounts.length === 0) return;

    setIsCheckingStatus(true);

    try {
      // Obtener los IDs de las cuentas pendientes
      const pendingAccounts = accounts.filter(acc => acc.verifiedStatus === 'pending');
      if (pendingAccounts.length === 0) return;

      // Verificar si alguna cuenta pendiente ha superado el tiempo máximo de espera (24 horas)
      const now = new Date();
      const MAX_VERIFICATION_TIME_MS = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

      // Actualizar cuentas con verificaciones que pasaron el tiempo límite
      const updatedAccounts = [...accounts];
      let hasTimedOutAccounts = false;

      pendingAccounts.forEach(acc => {
        if (acc.verified_request) {
          const requestTime = new Date(acc.verified_request).getTime();
          const elapsedTime = now.getTime() - requestTime;

          // Si ha pasado más de 24 horas, reiniciar completamente el estado
          if (elapsedTime > MAX_VERIFICATION_TIME_MS) {
            const index = updatedAccounts.findIndex(a => a.id === acc.id);
            if (index !== -1) {
              updatedAccounts[index] = {
                ...updatedAccounts[index],
                verifiedStatus: undefined, // Volver a estado no verificado
                verified_request: undefined, // Limpiar la solicitud de verificación
                verified_att: 0 // Reiniciar contador de intentos
              };
              hasTimedOutAccounts = true;
            }
          }
        }
      });

      // Actualizar el estado si hay cuentas cuya solicitud haya expirado
      if (hasTimedOutAccounts) {
        setAccounts(updatedAccounts);
        // Filtrar nuevamente para obtener solo las cuentas que siguen pendientes
        const stillPendingAccounts = updatedAccounts.filter(acc => acc.verifiedStatus === 'pending');
        if (stillPendingAccounts.length === 0) {
          setIsCheckingStatus(false);
          return;
        }
      }

      const pendingIds = pendingAccounts
        .map(acc => acc.account_id)
        .filter((id): id is string => id !== undefined);

      // Verificar el estado actual
      const verificationResults = await tiktokVerificationService.checkVerificationStatus(pendingIds);

      // Actualizar solo las cuentas que han cambiado
      if (verificationResults.length > 0) {
        setAccounts(prev => {
          const newAccounts = [...prev];

          verificationResults.forEach(updatedAcc => {
            const index = newAccounts.findIndex(acc =>
              acc.account_id === updatedAcc.account_id || acc.id === updatedAcc.id
            );

            if (index !== -1) {
              // Si la cuenta ya fue verificada, actualizar su estado
              if (updatedAcc.isVerified) {
                newAccounts[index].isVerified = true;
                newAccounts[index].verifiedStatus = undefined;
                newAccounts[index].verified_request = undefined;

                // Notificar al usuario sobre la verificación exitosa
                setTimeout(() => {
                  alert(`¡La cuenta ${newAccounts[index].username} ha sido verificada exitosamente!`);
                }, 500);
              }
            }
          });

          return newAccounts;
        });
      }
    } catch (error) {
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Iniciar proceso de verificación
  const handleVerify = (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    if (!account) return;

    setSelectedAccount(account);

    // Usar el código existente
    setVerificationCode(account.tiktok_code || tiktokVerificationService.generateVerificationCode());

    setShowVerificationModal(true);
    setVerificationStatus('idle');
    setStatusMessage('');
  };

  // Cerrar modal de verificación
  const handleCloseModal = () => {
    setShowVerificationModal(false);
    setSelectedAccount(null);
    setIsSubmitting(false);
    setVerificationStatus('idle');

    // Limpiar el intervalo de cuenta regresiva si existe
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }

    // Reiniciar el contador de tiempo
    setTimeRemaining(0);
  };

  // Función unificada para iniciar cuenta regresiva
  const startCountdown = () => {
    // Limpiar intervalo existente
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    
    // Configurar nuevo intervalo
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCountdownInterval(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setCountdownInterval(interval);
  };

  // Función para actualizar el estado de una cuenta
  const updateAccountStatus = (accountId: string, isVerified: boolean, isPending: boolean = true) => {
    setAccounts(prev => 
      prev.map(acc =>
        acc.id === accountId
          ? {
              ...acc,
              isVerified: isVerified,
              verifiedStatus: isPending && !isVerified ? 'pending' : undefined,
              verified_request: isPending && !isVerified ? new Date().toISOString() : undefined
            }
          : acc
      )
    );
  };

  // Función unificada para procesar verificación (manual o automática)
  const handleAccountVerification = async (isManualCheck = false) => {
    if (!selectedAccount) return;

    // Verificar que account_id existe
    if (!selectedAccount.account_id) {
      setVerificationStatus('error');
      setStatusMessage('Error: ID de cuenta inválido');
      return;
    }

    // Verificar tiempo mínimo entre verificaciones
    const now = new Date().getTime();
    const MIN_TIME_BETWEEN_VERIFICATIONS_MS = 30 * 1000; // 30 segundos
    
    if (lastVerificationTime !== null) {
      const elapsedTime = now - lastVerificationTime;
      
      if (elapsedTime < MIN_TIME_BETWEEN_VERIFICATIONS_MS) {
        const secondsToWait = Math.ceil((MIN_TIME_BETWEEN_VERIFICATIONS_MS - elapsedTime) / 1000);
        setTimeRemaining(secondsToWait);
        setVerificationStatus('error');
        setStatusMessage(`Por favor espera ${secondsToWait} segundos antes de verificar nuevamente.`);
        
        // Iniciar cuenta regresiva si no está activa
        startCountdown();
        return;
      }
    }

    setIsSubmitting(true);
    setVerificationStatus('loading');
    setStatusMessage(isManualCheck ? 'Verificando cuenta...' : 'Procesando solicitud...');

    try {
      // Extraer el nombre de usuario sin @ si lo tiene
      const tiktokUsername = selectedAccount.username.startsWith('@')
        ? selectedAccount.username.substring(1)
        : selectedAccount.username;

      // Ejecutar verificación real (no simulada)
      let result;
      
      if (isManualCheck) {
        // Verificación manual usando el servicio
        result = await tiktokVerificationService.checkVerificationStatus([selectedAccount.account_id]);
        // Determinar si alguna cuenta fue verificada
        const isVerified = result.some(acc => 
          (acc.account_id === selectedAccount.account_id || acc.id === selectedAccount.id) && acc.isVerified
        );
        
        result = { success: true, isVerified, message: isVerified ? 'Verificación exitosa' : 'No se encontró el código en el perfil' };
      } else {
        // Solicitud inicial de verificación
        result = await tiktokVerificationService.requestTikTokVerification(
          selectedAccount.account_id,
          verificationCode,
          tiktokUsername
        );
        // Para solicitudes iniciales, siempre el estado es pendiente
        result = { ...result, isVerified: false };
      }

      // Actualizar estado según resultado
      if (result.success) {
        updateAccountStatus(selectedAccount.id, result.isVerified, !result.isVerified);
        
        setVerificationStatus('success');
        setStatusMessage(result.isVerified 
          ? '¡Cuenta verificada exitosamente!'
          : 'Proceso de verificación iniciado. La cuenta está en verificación pendiente.');

        // Registrar tiempo de verificación
        setLastVerificationTime(now);
        
        // Iniciar cuenta regresiva
        setTimeRemaining(30);
        startCountdown();
        
        if (result.isVerified) {
          // Cerrar modal después de verificación exitosa
          setTimeout(() => {
            handleCloseModal();
            toast.success('¡Cuenta verificada exitosamente!');
          }, 2000);
        } else if (!isManualCheck) {
          // Para verificación inicial, mostrar mensaje de instrucciones
          setTimeout(() => {
            setShowVerificationModal(false);
            toast.success('Verificación enviada. Coloca el código en tu bio de TikTok.');
          }, 2000);
        }
      } else {
        setVerificationStatus('error');
        setStatusMessage(result.message || 'Error en la verificación');
      }
    } catch (error: any) {
      setVerificationStatus('error');
      setStatusMessage(error.message || 'Error al procesar la verificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Procesar verificación de cuenta (antes handleVerifyAccount)
  const handleVerifyAccount = () => handleAccountVerification(false);
  
  // Intentar verificación manual (antes handleManualCheck)
  const handleManualCheck = () => handleAccountVerification(true);

  // Función para reiniciar el proceso de verificación
  const handleResetVerification = async () => {
    if (!selectedAccount) return;

    setIsSubmitting(true);
    setVerificationStatus('loading');
    setStatusMessage('Reiniciando proceso de verificación...');

    try {
      // Verificar que account_id existe y es válido
      if (!selectedAccount.account_id) {
        setVerificationStatus('error');
        setStatusMessage('Error: No se puede reiniciar la verificación porque el ID de cuenta es inválido.');
        setIsSubmitting(false);
        return;
      }

      // Extraer el nombre de usuario sin el @ si lo tiene
      const tiktokUsername = selectedAccount.username.startsWith('@')
        ? selectedAccount.username.substring(1)
        : selectedAccount.username;

      // Llamar al servicio con set=1 para reiniciar
      const result = await tiktokVerificationService.resetTikTokVerification(
        selectedAccount.account_id,
        tiktokUsername
      );

      if (result.success) {
        // Verificar que el objeto account en el resultado es válido
        if (!result.account) {
          setVerificationStatus('error');
          setStatusMessage('Error al reiniciar: La respuesta no incluye información de la cuenta.');
          setIsSubmitting(false);
          return;
        }

        // Actualizar el estado de la cuenta
        setAccounts(prev =>
          prev.map(acc =>
            acc.id === selectedAccount.id ?
            {
              ...acc,
              verified_att: 0,            // Reiniciar contador
              verifiedStatus: 'pending',  // Establecer como pendiente inmediatamente
              verified_request: new Date().toISOString() // Nueva solicitud de verificación
            } : acc
          )
        );

        setVerificationStatus('success');
        setStatusMessage('Proceso de verificación reiniciado. La cuenta está en verificación pendiente.');

        // Cerrar modal después de 2 segundos sin volver a abrirlo
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
      } else {
        setVerificationStatus('error');
        setStatusMessage(result.message || 'Error al reiniciar la verificación');
      }
    } catch (error: any) {
      setVerificationStatus('error');
      setStatusMessage(error.message || 'Error al reiniciar el proceso. Inténtalo más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para renderizar el indicador de estado de la cuenta
  const renderVerificationStatus = (account: TikTokAccount) => {
    if (account.isVerified) {
      return (
        <div className="flex items-center text-green-500 text-sm mt-2">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span>Verificada</span>
        </div>
      );
    } else if (account.verifiedStatus === 'pending') {
      // Verificar si la cuenta ha alcanzado el límite de intentos
      const hasMaxAttempts = account.verified_att !== undefined && account.verified_att >= 3;

      return (
        <div>
          <div
            className={`flex items-center ${hasMaxAttempts ? 'text-orange-500' : 'text-yellow-500'} text-sm mt-2 ${hasMaxAttempts ? 'cursor-pointer hover:underline' : ''}`}
            onClick={hasMaxAttempts ? () => handleVerify(account.id) : undefined}
            title={hasMaxAttempts ? "Haz clic para reiniciar el proceso de verificación" : undefined}
          >
            {hasMaxAttempts ? <AlertTriangle className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
            <span>{hasMaxAttempts ? 'Reintentar Verificacion' : 'Verificación pendiente'}</span>
          </div>

          {account.verified_request && !hasMaxAttempts && (
            <div className="text-gray-400 text-xs mt-1 flex items-center">
              {getTimeRemaining(account.verified_request)}
            </div>
          )}
          
          {hasMaxAttempts && (
            <div
              className="text-orange-400 text-xs mt-1 cursor-pointer hover:underline"
              onClick={() => handleVerify(account.id)}
              title="Haz clic para reiniciar el proceso de verificación"
            >
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="mt-2 flex items-center justify-center">
          <AlertTriangle className="text-indigo-400 w-4 h-4 mr-1" />
          <button
            className="text-indigo-400 text-sm hover:underline"
            onClick={() => handleVerify(account.id)}
          >
            Verificar
          </button>
        </div>
      );
    }
  };

  // Función para renderizar el mensaje de estado de verificación
  const renderStatusMessage = () => {
    if (verificationStatus === 'idle') return null;

    const statusClasses = {
      loading: 'text-blue-400',
      success: 'text-green-400',
      error: 'text-red-400',
      warning: 'text-yellow-400',
      info: 'text-blue-300'
    };

    const statusIcons = {
      loading: <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>,
      success: <CheckCircle size={16} className="mr-2" />,
      error: <AlertTriangle size={16} className="mr-2" />,
      warning: <AlertTriangle size={16} className="mr-2" />,
      info: <AlertCircle size={16} className="mr-2" />
    };

    return (
      <div className={`mt-4 flex items-center ${statusClasses[verificationStatus]}`}>
        {statusIcons[verificationStatus]}
        <span>{statusMessage}</span>
        {timeRemaining > 0 && verificationStatus === 'error' && (
          <span className="ml-1">({timeRemaining}s)</span>
        )}
      </div>
    );
  };

  // Limpiar el intervalo cuando se desmonte el componente
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-md">
        <div className="p-5 border-b border-[#1c1c1c]">
          <h2 className="text-lg font-medium">Cuentas conectadas</h2>
          <p className="text-sm text-gray-400 mt-1">Gestiona tus cuentas de TikTok vinculadas</p>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#8e4dff] border-r-transparent"></div>
              <p className="mt-2 text-gray-400">Cargando cuentas...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto mb-2 text-yellow-500" size={32} />
              <p className="text-yellow-500">{error || 'No se encontraron cuentas de TikTok asociadas a este usuario.'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4">
                {accounts.map((account) => (
                  <div key={account.id} className="relative">
                    <div className="bg-[#161616] text-white rounded-full px-4 py-2 flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        account.isVerified ? 'bg-green-500' :
                        account.verifiedStatus === 'pending'
                          ? (account.verified_att !== undefined && account.verified_att >= 3
                              ? 'bg-orange-500' : 'bg-yellow-500')
                          : 'bg-red-500'
                      }`}></div>
                      <span>{account.username}</span>
                    </div>
                    {renderVerificationStatus(account)}
                  </div>
                ))}
              </div>

              {isCheckingStatus && (
                <div className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center">
                  <RefreshCw size={12} className="mr-1 animate-spin" />
                  <span>Verificando estado de cuentas pendientes...</span>
                </div>
              )}

              {error && (
                <div className="mt-4 text-center text-red-400">
                  <p>{error}</p>
                  <button
                    onClick={fetchTikTokAccounts}
                    className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm underline"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de verificación */}
      {showVerificationModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-lg w-full max-w-md p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>

            <div className="mb-4">
              <p className="text-gray-300 text-center">
                {selectedAccount && typeof selectedAccount.verified_att === 'number' && selectedAccount.verified_att >= 3
                  ? "Has alcanzado el límite de intentos. Para continuar, necesitas reiniciar el proceso de verificación."
                  : "Para poder procesar los pagos, es importante que verifiquemos que tu eres el dueño de la siguiente cuenta de TikTok."}
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="bg-[#161616] text-white rounded-full px-5 py-2.5 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  selectedAccount.isVerified ? 'bg-green-500' :
                  selectedAccount.verifiedStatus === 'pending'
                    ? (selectedAccount.verified_att !== undefined && selectedAccount.verified_att >= 3
                        ? 'bg-orange-500' : 'bg-yellow-500')
                    : 'bg-red-500'
                }`}></div>
                <span>{selectedAccount.username}</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-white font-medium mb-4">Pasos para verificar tu cuenta:</h3>
              <ol className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="flex-shrink-0 bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center mr-2">1</span>
                  <span>Copia el código</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center mr-2">2</span>
                  <span>Pégalo en la bio (perfil) de tu cuenta de TikTok</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center mr-2">3</span>
                  <span>Una vez lo hayas hecho, toca el botón "Verificar mi cuenta"</span>
                </li>
              </ol>
            </div>

            <p className="text-gray-300 mb-2">
              Nuestro sistema revisará tu perfil y, si el código está visible, marcará tu cuenta como verificada.
            </p>

            <div className="mb-6">
              <p className="text-gray-400 mb-2">Este es tu código:</p>
              <div className="relative">
                <div className="bg-[#161616] text-center p-3 rounded-md border border-[#1c1c1c] text-xl font-bold text-white">
                  {verificationCode}
                </div>
                <button
                  onClick={async () => {
                    try {
                      if (!verificationCode.trim()) {
                        toast.error('El código está vacío, no se puede copiar.');
                        return;
                      }
                  
                      await navigator.clipboard.writeText(verificationCode);
                      toast.success('Código copiado al portapapeles');
                    } catch (err) {
                      console.error("Error al copiar:", err);
                      toast.error('No se pudo copiar el código.');
                    }
                  }}
                  className="absolute right-2 top-2 text-gray-400 hover:text-white"
                  title="Copiar al portapapeles"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>

            {renderStatusMessage()}

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={selectedAccount && typeof selectedAccount.verified_att === 'number' && selectedAccount.verified_att >= 3
                  ? handleResetVerification
                  : handleVerifyAccount}
                className={`w-full bg-[#8e4dff] hover:bg-[#7c3aed] text-white py-3 px-4 rounded-md text-center transition-colors ${(isSubmitting || timeRemaining > 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isSubmitting || verificationStatus === 'success' || timeRemaining > 0}
              >
                {isSubmitting && verificationStatus === 'loading' ? 'Procesando...' :
                 timeRemaining > 0 ? `Espera ${timeRemaining}s para verificar` :
                 selectedAccount && typeof selectedAccount.verified_att === 'number' && selectedAccount.verified_att >= 3
                  ? 'Reiniciar proceso de verificación'
                  : 'Verificar Cuenta de TikTok'}
              </button>

              {selectedAccount && selectedAccount.verifiedStatus === 'pending' && !(typeof selectedAccount.verified_att === 'number' && selectedAccount.verified_att >= 3) && (
                <button
                  onClick={handleManualCheck}
                  className={`w-full mt-2 bg-[#1c1c1c] hover:bg-[#2c2c2c] text-white py-3 px-4 rounded-md text-center transition-colors ${(isSubmitting || timeRemaining > 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isSubmitting || verificationStatus === 'success' || timeRemaining > 0}
                >
                  {isSubmitting && verificationStatus === 'loading' ? 'Verificando...' :
                   timeRemaining > 0 ? `Espera ${timeRemaining}s` : 'Ya coloqué el código - Verificar ahora'}
                </button>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center text-yellow-500 text-sm">
              <AlertTriangle size={16} className="mr-2" />
              <span>Este paso es obligatorio para recibir pagos.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileConnectedAccounts;
