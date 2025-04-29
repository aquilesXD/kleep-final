import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import tiktokVerificationService from '../../services/tiktokVerificationService';
import { toast } from 'react-hot-toast';
import { getAuthToken } from '../../services/authService'; // Importar la función getAuthToken
import { useNavigate } from 'react-router-dom'; // Importar useNavigate para redirección
import { useRetry } from '../../hooks/useRetry';
import { useVerificationCodeCache } from '../../hooks/useVerificationCodeCache';
import { useNetworkError } from '../../hooks/useNetworkError';
import { useInputValidation } from '../../hooks/useInputValidation';

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

// Añadir interfaces para los tipos de respuesta
interface VerificationResult {
  success: boolean;
  isVerified: boolean;
  message?: string;
  account?: TikTokAccount;
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
  const navigate = useNavigate(); // Añadir navigate para redirección

  // Añadir nuevos estados para control de concurrencia
  const [verificationLocks, setVerificationLocks] = useState<Map<string, boolean>>(new Map());
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // Nuevos hooks
  const { executeWithRetry, isRetrying } = useRetry();
  const codeCache = useVerificationCodeCache();
  const { isOnline, handleNetworkError } = useNetworkError();
  const usernameValidation = useInputValidation('', {
    required: true,
    pattern: /^[a-zA-Z0-9._]{1,24}$/,
    minLength: 1,
    maxLength: 24
  });

  // Verificar si el usuario está autenticado al cargar el componente
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login'); // Redirigir al login si no hay token
      return;
    }
  }, [navigate]);

  // Asegurar que el `account_id` esté presente y válido al cargar las cuentas
  const fetchTikTokAccounts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authToken = getAuthToken();
      if (!authToken) {
        navigate('/login');
        return;
      }

      await executeWithRetry(
        async () => {
          const accountsData = await tiktokVerificationService.fetchTikTokAccountsFromNewApi();
          return accountsData;
        },
        (accountsData) => {
          const validatedAccounts = accountsData.map(account => ({
            ...account,
            account_id: account.account_id || account.id || ''
          }));
          setAccounts(validatedAccounts);

          if (validatedAccounts.some(acc => acc.verifiedStatus === 'pending')) {
            setTimeout(() => checkPendingAccountsStatus(), 1000);
          }
        },
        (error) => {
          const networkError = handleNetworkError(error);
          setError(networkError.message);
          if (networkError.type === 'AUTH') {
            navigate('/login');
          }
        }
      );
    } catch (error: any) {
      const networkError = handleNetworkError(error);
      setError(networkError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnverifiedAccounts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar token primero
      const authToken = getAuthToken();
      if (!authToken) {
        navigate('/login'); // Redirigir al login si no hay token
        return;
      }
      
      // Llamar a la función para obtener cuentas no verificadas
      const unverifiedAccounts = await tiktokVerificationService.fetchUnverifiedTikTokAccounts();

      // Filtrar cuentas duplicadas antes de actualizar el estado
      setAccounts((prevAccounts) => {
        const existingIds = new Set(prevAccounts.map((acc) => acc.id));
        const filteredAccounts = unverifiedAccounts.filter((acc) => !existingIds.has(acc.id));
        return [...prevAccounts, ...filteredAccounts];
      });
    } catch (error: any) {
      // Si es error de autenticación, redirigir al login
      if (error.message?.includes('401') || error.message?.includes('No autorizado') || error.message?.includes('token')) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }
      setError(`Error al cargar cuentas no verificadas: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTikTokAccounts();
    fetchUnverifiedAccounts(); // Llamar a la función para obtener cuentas no verificadas

    // Establecer un intervalo para verificar el estado de las cuentas pendientes cada 30 segundos
    const intervalId = setInterval(() => {
      if (accounts.some(acc => acc.verifiedStatus === 'pending')) {
        checkPendingAccountsStatus();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(intervalId);
  }, []);

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

  // Añadir nuevos estados para control de concurrencia
  const acquireLock = (operationId: string): boolean => {
    if (verificationLocks.get(operationId)) {
      return false;
    }
    setVerificationLocks(prev => new Map(prev).set(operationId, true));
    setPendingOperations(prev => new Set(prev).add(operationId));
    return true;
  };

  const releaseLock = (operationId: string) => {
    setVerificationLocks(prev => {
      const newLocks = new Map(prev);
      newLocks.delete(operationId);
      return newLocks;
    });
    setPendingOperations(prev => {
      const newOps = new Set(prev);
      newOps.delete(operationId);
      return newOps;
    });
  };

  // Verifica el estado actual de las cuentas pendientes
  const checkPendingAccountsStatus = async () => {
    if (isCheckingStatus || accounts.length === 0) return;

    const operationId = 'check-pending-accounts';
    if (!acquireLock(operationId)) {
      return;
    }

    setIsCheckingStatus(true);

    try {
      const pendingAccounts = accounts.filter(acc => acc.verifiedStatus === 'pending');
      if (pendingAccounts.length === 0) return;

      const pendingIds = pendingAccounts
        .map(acc => acc.account_id)
        .filter((id): id is string => id !== undefined);

      await executeWithRetry(
        async () => {
          const verificationResults = await tiktokVerificationService.checkVerificationStatus(pendingIds);
          return verificationResults;
        },
        (verificationResults) => {
          if (verificationResults.length > 0) {
            setAccounts(prev => {
              const newAccounts = [...prev];
              verificationResults.forEach(updatedAcc => {
                const index = newAccounts.findIndex(acc =>
                  acc.account_id === updatedAcc.account_id || acc.id === updatedAcc.id
                );
                if (index !== -1) {
                  if (updatedAcc.isVerified) {
                    newAccounts[index].isVerified = true;
                    newAccounts[index].verifiedStatus = undefined;
                    newAccounts[index].verified_request = undefined;
                    setTimeout(() => {
                      handleSuccessfulVerification(newAccounts[index], index);
                    }, 500);
                  }
                }
              });
              return newAccounts;
            });
          }
        },
        (error) => {
          console.error('Error al verificar estado de cuentas:', error);
        }
      );
    } catch (error) {
      console.error('Error al verificar estado de cuentas:', error);
    } finally {
      setIsCheckingStatus(false);
      releaseLock(operationId);
    }
  };

  // Manejo de la verificación exitosa y respuesta
  const handleSuccessfulVerification = (account: TikTokAccount, index: number) => {
    // Mostrar mensaje de éxito y actualizar UI
    toast.success(`¡La cuenta ${account.username} ha sido verificada exitosamente!`);
  };

  // Iniciar proceso de verificación
  const handleVerify = (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    if (!account) return;

    setSelectedAccount({
      ...account,
      verifiedStatus: 'pending' // Establecer el estado como pendiente al abrir el modal
    });

    // Usar el código proporcionado por el backend
    setVerificationCode(account.tiktok_code || "");

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
  const updateAccountStatus = (accountId: string, isVerified: boolean, isPending: boolean = true, tiktokCode: string = "") => {
    setAccounts(prev => 
      prev.map(acc =>
        acc.id === accountId
          ? {
              ...acc,
              isVerified: isVerified,
              verifiedStatus: isPending && !isVerified ? 'pending' : undefined,
              verified_request: isPending && !isVerified ? new Date().toISOString() : undefined,
              tiktok_code: tiktokCode || acc.tiktok_code // Mantener o actualizar el código
            }
          : acc
      )
    );
  };

  // Función unificada para procesar verificación (manual o automática)
  const handleAccountVerification = async (isManualCheck = false) => {
    if (!selectedAccount) return;

    const operationId = `verify-${selectedAccount.id}-${isManualCheck ? 'manual' : 'auto'}`;
    
    if (!acquireLock(operationId)) {
      toast.error('Ya hay una verificación en curso para esta cuenta');
      return;
    }

    try {
      setIsSubmitting(true);
      setVerificationStatus('loading');
      setStatusMessage(isManualCheck ? 'Verificando cuenta...' : 'Procesando solicitud...');

      const now = new Date().getTime();
      const MIN_TIME_BETWEEN_VERIFICATIONS_MS = 30 * 1000;

      if (lastVerificationTime !== null) {
        const elapsedTime = now - lastVerificationTime;
        if (elapsedTime < MIN_TIME_BETWEEN_VERIFICATIONS_MS) {
          const secondsToWait = Math.ceil((MIN_TIME_BETWEEN_VERIFICATIONS_MS - elapsedTime) / 1000);
          setTimeRemaining(secondsToWait);
          setVerificationStatus('error');
          setStatusMessage(`Por favor espera ${secondsToWait} segundos antes de verificar nuevamente.`);
          startCountdown();
          return;
        }
      }

      let result: VerificationResult;
      if (isManualCheck) {
        const verificationResults = await tiktokVerificationService.checkVerificationStatus([selectedAccount.account_id || '']);
        const isVerified = verificationResults.some(acc => 
          (acc.account_id === selectedAccount.account_id || acc.id === selectedAccount.id) && acc.isVerified
        );
        result = {
          success: true,
          isVerified,
          message: isVerified ? 'Verificación exitosa' : 'No se encontró el código en el perfil'
        };
      } else {
        const tiktokUsername = selectedAccount.username.startsWith('@') 
          ? selectedAccount.username.substring(1) 
          : selectedAccount.username;
        
        const verificationResponse = await tiktokVerificationService.requestTikTokVerification({
          account_id: selectedAccount.account_id || '',
          username: tiktokUsername,
          verification_code: verificationCode
        });
        
        result = {
          success: verificationResponse.success,
          isVerified: verificationResponse.account?.isVerified || false,
          message: verificationResponse.message,
          account: verificationResponse.account
        };
      }

      if (result.success) {
        updateAccountStatus(selectedAccount.id, result.isVerified, !result.isVerified, verificationCode);
        
        setVerificationStatus('success');
        setStatusMessage(result.isVerified 
          ? '¡Cuenta verificada exitosamente!'
          : 'Proceso de verificación iniciado. La cuenta está en verificación pendiente.');

        setLastVerificationTime(now);
        setTimeRemaining(30);
        startCountdown();

        if (result.isVerified) {
          setTimeout(() => {
            handleCloseModal();
            toast.success('¡Cuenta verificada exitosamente!');
          }, 2000);
        } else if (!isManualCheck) {
          setTimeout(() => {
            setShowVerificationModal(false);
            toast.success(`Verificación enviada. Coloca el código ${verificationCode} en tu bio de TikTok.`);
          }, 2000);
        }
      } else {
        setVerificationStatus('error');
        setStatusMessage(result.message || 'Error en la verificación');
      }
    } catch (error: any) {
      // Si es error de autenticación, redirigir al login
      if (error.message?.includes('401') || error.message?.includes('No autorizado') || error.message?.includes('token')) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }

      // Manejo específico para error 422
      if (error.message?.includes('422')) {
        setVerificationStatus('error');
        let errorMessage = 'Datos de verificación rechazados por el servidor.';
        
        // Intentar extraer un mensaje más específico
        const detailMatch = error.message.match(/Error 422: (.+)/);
        if (detailMatch && detailMatch[1]) {
          errorMessage = detailMatch[1];
        }
        
        setStatusMessage(errorMessage);
        return;
      }
      
      setVerificationStatus('error');
      setStatusMessage(error.message || 'Error al procesar la verificación');
    } finally {
      setIsSubmitting(false);
      releaseLock(operationId);
    }
  };

  // Procesar verificación de cuenta (antes handleVerifyAccount)
  const handleVerifyAccount = async () => {
    if (!selectedAccount) return;

    try {
      await executeWithRetry(
        async () => {
          const result = await tiktokVerificationService.requestTikTokVerification({
            account_id: selectedAccount.account_id || '',
            username: selectedAccount.username,
            verification_code: verificationCode
          });
          return result;
        },
        (result) => {
          if (result.success) {
            codeCache.setCode(selectedAccount.id, verificationCode);
            // Asegurar que isVerified sea un booleano
            const isVerified = result.isVerified ?? false;
            updateAccountStatus(selectedAccount.id, isVerified, !isVerified, verificationCode);
            setVerificationStatus('success');
            setStatusMessage(isVerified 
              ? '¡Cuenta verificada exitosamente!'
              : 'Proceso de verificación iniciado. La cuenta está en verificación pendiente.');
            
            setLastVerificationTime(Date.now());
            setTimeRemaining(30);
            startCountdown();

            if (isVerified) {
              setTimeout(() => {
                handleCloseModal();
                toast.success('¡Cuenta verificada exitosamente!');
              }, 2000);
            } else {
              setTimeout(() => {
                setShowVerificationModal(false);
                toast.success(`Verificación enviada. Coloca el código ${verificationCode} en tu bio de TikTok.`);
              }, 2000);
            }
          }
        },
        (error) => {
          const networkError = handleNetworkError(error);
          setVerificationStatus('error');
          setStatusMessage(networkError.message);
          if (networkError.type === 'AUTH') {
            navigate('/login');
          }
        }
      );
    } catch (error: any) {
      const networkError = handleNetworkError(error);
      setVerificationStatus('error');
      setStatusMessage(networkError.message);
    }
  };
  
  // Función para reiniciar el proceso de verificación
  const handleResetVerification = async () => {
    if (!selectedAccount) return;

    try {
      await executeWithRetry(
        async () => {
          const tiktokUsername = selectedAccount.username.startsWith('@')
            ? selectedAccount.username.substring(1)
            : selectedAccount.username;

          const result = await tiktokVerificationService.resetTikTokVerification(
            selectedAccount.account_id || '',
            tiktokUsername
          );
          return result;
        },
        (result) => {
          if (result.success) {
            setAccounts(prev =>
              prev.map(acc =>
                acc.id === selectedAccount.id
                  ? {
                      ...acc,
                      verified_att: 0,
                      verifiedStatus: 'pending',
                      verified_request: new Date().toISOString()
                    }
                  : acc
              )
            );

            setVerificationStatus('success');
            setStatusMessage('Proceso de verificación reiniciado. La cuenta está en verificación pendiente.');

            setTimeout(() => {
              handleCloseModal();
            }, 2000);
          }
        },
        (error) => {
          const networkError = handleNetworkError(error);
          setVerificationStatus('error');
          setStatusMessage(networkError.message);
          if (networkError.type === 'AUTH') {
            navigate('/login');
          }
        }
      );
    } catch (error: any) {
      const networkError = handleNetworkError(error);
      setVerificationStatus('error');
      setStatusMessage(networkError.message);
    }
  };

  // Actualizar la función para manejar la solicitud de verificación con la URL correcta
  const handleRequestVerification = async (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    try {
      setIsSubmitting(true);
      setVerificationStatus('loading');
      setStatusMessage('Solicitando verificación...');

      const verificationResult = await tiktokVerificationService.requestTikTokVerification({
        account_id: account.id,
        username: account.username,
        verification_code: verificationCode
      });

      if (verificationResult.success && verificationResult.account) {
        setVerificationStatus('success');
        setStatusMessage('Solicitud de verificación enviada correctamente');
        updateAccountStatus(accountId, false, true);
      } else {
        setVerificationStatus('error');
        setStatusMessage(verificationResult.message || 'Error al solicitar verificación');
      }
    } catch (error: any) {
      setVerificationStatus('error');
      setStatusMessage(error.message || 'Error al solicitar verificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para renderizar el indicador de estado de la cuenta
  const renderVerificationStatus = (account: TikTokAccount) => {
    if (!account.verifiedStatus) return null;

    switch (account.verifiedStatus) {
      case 'pending':
        return (
          <div className="flex items-center text-yellow-600">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm">Verificacion pendiente</span>
          </div>
        );
      case 'verified':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>Verificado</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center text-red-600">
            <X className="w-4 h-4 mr-1" />
            <span>Fallido</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Función para renderizar el mensaje de estado de verificación
  const renderStatusMessage = () => {
    if (!statusMessage) return null;

    return (
      <div className={`mt-2 text-sm ${
        verificationStatus === 'success' ? 'text-green-600' :
        verificationStatus === 'error' ? 'text-red-600' :
        verificationStatus === 'warning' ? 'text-yellow-600' :
        'text-gray-600'
      }`}>
        {statusMessage}
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

  // Añadir indicador visual de operaciones pendientes
  const renderPendingOperations = () => {
    if (pendingOperations.size === 0) return null;

    return (
      <div className="fixed top-4 right-4 bg-[#1c1c1c] p-2 rounded-md text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
          <span>Operaciones en curso: {pendingOperations.size}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {renderPendingOperations()}
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
                {accounts.map((account, index) => (
                  <div key={`${account.id}-${index}`} className="relative">
                    <div className="bg-[#161616] text-white rounded-lg p-4 flex flex-col items-center">
                      <div className="flex items-center mb-2">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          account.isVerified 
                            ? 'bg-green-500'  // Verde: Cuenta verificada
                            : account.verified_att !== undefined && account.verified_att >= 3
                              ? 'bg-orange-500'  // Naranja: Límite de intentos alcanzado
                              : 'bg-yellow-500'  // Amarillo: En proceso de verificación o pendiente
                        }`}></div>
                        <span className="font-medium">{account.username}</span>
                      </div>
                      
                      {/* Estado de verificación */}
                      {account.isVerified ? (
                        <div className="flex items-center text-green-500">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm">Verificada</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">Verificación pendiente</span>
                        </div>
                      )}
                      
                      {/* Contador de intentos si es necesario */}
                      {account.verified_att !== undefined && account.verified_att > 0 && (
                        <div className="mt-1 text-xs text-gray-400">
                          Intentos: {account.verified_att}/3
                        </div>
                      )}
                      
                    </div>
                      {/* Enlace para abrir el modal de verificación */}
                      {!account.isVerified && (
                        <button
                          onClick={() => {
                            setSelectedAccount({
                              ...account,
                              verifiedStatus: 'pending'
                            });
                            setVerificationCode(account.tiktok_code || "");
                            setShowVerificationModal(true);
                            setVerificationStatus('idle');
                            setStatusMessage('');
                          }}
                          className="mt-2 text-[#8e4dff] hover:text-[#7c3aed] text-sm font-medium underline transition-colors w-full text-center"
                          disabled={isSubmitting || timeRemaining > 0}
                        >
                          Verificar
                        </button>
                      )}
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
                  selectedAccount.verifiedStatus === 'pending' || !selectedAccount.isVerified
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