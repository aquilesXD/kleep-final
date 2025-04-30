/**
 * Servicio para manejar las operaciones relacionadas con la verificación de cuentas de TikTok
 */

// Asegurar que se importe getAuthToken y getAuthTokenOrThrow correctamente
// Si getAuthTokenOrThrow no existe en authService, puedes definirla aquí
import { getAuthToken /* , getAuthTokenOrThrow */ } from './authService';

// Definir getAuthTokenOrThrow localmente si no viene del authService
const getAuthTokenOrThrow = (): string => {
  const authToken = getAuthToken(); // Usar la función importada
  if (!authToken) {
    throw new Error('No se encontró un token de autenticación válido. Por favor, inicia sesión nuevamente.');
  }
  return authToken;
};


interface TikTokAccount {
  id: string;
  username: string;
  isVerified: boolean;
  verifiedStatus?: string; // 'pending', 'unverified', etc.
  tiktok_code?: string; // Código de verificación
  account_id?: string; // ID de la cuenta en el backend (puede ser diferente de 'id')
  verified_request?: string; // Timestamp de la solicitud de verificación
  verified_att?: number; // Contador de intentos de verificación (asegurar que sea número)
}

interface VerificationResponse {
  success: boolean;
  message: string;
  account?: TikTokAccount;
  verification_code?: string;
  isVerified?: boolean;
}

// URL del endpoint principal de verificación
const VERIFY_URL = 'https://contabl.net/kleep/api/tiktok-accounts/verify';


/**
* Obtiene las cuentas de TikTok asociadas a un usuario (Endpoint antiguo/alternativo)
* @param userId ID del usuario (si este endpoint lo requiere)
* @returns Promise con las cuentas formateadas
* @deprecated Considerar reemplazar por fetchTikTokAccountsFromNewApi
*/
export const fetchTikTokAccounts = async (userId: string): Promise<TikTokAccount[]> => {
  // Este endpoint parece no requerir token de autenticación, solo user id en query param
  const apiUrl = `https://contabl.net/nova/get-tiktok-accounts-by-user?id_user=${encodeURIComponent(userId)}`;

  try {
      const response = await fetch(apiUrl);

    if (!response.ok) {
          throw new Error(`Error en la petición (fetchTikTokAccounts): ${response.status} ${response.statusText || ''}`);
      }

      const data = await response.json();

      // Verificar la estructura de la respuesta (puede ser accounts o data)
      const accountsArray = data.accounts || data.data;

      if (!Array.isArray(accountsArray)) {
          throw new Error('Formato de respuesta inválido (fetchTikTokAccounts): El campo accounts/data no es un array.');
      }

      // Transformar los datos al formato que necesita la UI
      return accountsArray.map((account: any) => {
          // Asegurar que verified_att sea un número
          let verifiedAttempts = 0;
          if (account.verified_att !== undefined) {
              verifiedAttempts = typeof account.verified_att === 'number'
                  ? account.verified_att
                  : parseInt(account.verified_att, 10) || 0; // Parsear y usar 0 si falla
          }

          return {
              // Usar el id del backend, o generar uno si no existe (menos ideal)
              id: String(account.id || account.account_id || Math.random()),
              account_id: String(account.id || account.account_id || ''), // Asegurar que sea string
              username: account.account || account.username || `@${account.id_user || 'usuario'}`,
              isVerified: account.verified === 1 || account.verified === true,
              // Determinar verifiedStatus: 'pending' si no está verificado Y hay solicitud pendiente
              verifiedStatus: !(account.verified === 1 || account.verified === true) && (account.verified_request || account.status === 'pending') ? 'pending' : undefined,
              tiktok_code: account.tiktok_code ? String(account.tiktok_code) : "", // Usar el código del backend o cadena vacía
              verified_request: account.verified_request || account.created_at || undefined, // Usar timestamp de solicitud
              verified_att: verifiedAttempts // Asegurar que siempre sea un número
          };
      });
  } catch (error: any) {
      console.error('Error en fetchTikTokAccounts:', error);
      throw error;
  }
};

/**
 * Obtiene las cuentas de TikTok asociadas al usuario autenticado (Nueva API)
 * Requiere autenticación. Llama a /kleep/api/tiktok-accounts.
 * @returns Promise con las cuentas formateadas
 */
export const fetchTikTokAccountsFromNewApi = async (): Promise<TikTokAccount[]> => {
  const apiUrl = 'https://contabl.net/kleep/api/tiktok-accounts';

  try {
    // Obtener el token de autenticación o lanzar error
    const authToken = getAuthTokenOrThrow();

    // Intentar primero con Bearer token (o el formato principal de tu API)
    let response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
      },
    });

    // --- Lógica de Reintento para 401 (si tu API requiere probar formatos) ---
    if (response.status === 401) {
      console.warn('401 en fetchTikTokAccountsFromNewApi, intentando formatos alternativos.');
      // Intentar con token sin Bearer
      response = await fetch(apiUrl, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': authToken } });

      // Si sigue fallando, intentar con query param
      if (response.status === 401) {
        console.warn('401 persistente, intentando con query param.');
        response = await fetch(`${apiUrl}?api_token=${encodeURIComponent(authToken)}`, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } });
      }
    }
    // --- Fin Lógica de Reintento ---

    // Manejar error 401 final después de reintentos
    if (response.status === 401) {
      throw new Error('Error 401: No autorizado. Tu sesión ha expirada.');
    }

    if (!response.ok) {
      throw new Error(`Error al cargar cuentas (fetchTikTokAccountsFromNewApi): ${response.status} ${response.statusText || ''}`);
    }

    const data = await response.json();

    // Asumir que la respuesta tiene { success: boolean, accounts: CuentaBackend[] }
    if (!data.success || !Array.isArray(data.accounts)) {
      throw new Error('Formato de respuesta inválido (fetchTikTokAccountsFromNewApi).');
    }

    // Transformar los datos al formato que necesita la UI
    return data.accounts.map((account: any) => ({
      id: String(account.id), // Asegurar que sea string
      account_id: String(account.id), // Usar el mismo ID del backend, asegurar string
      username: account.username || account.account || '',
      isVerified: account.verified === 1 || account.verified === true, // Asumir 'verified' como 1 o true
      // Determinar verifiedStatus: 'pending' si no está verificado Y el estado es 'pending' en backend
      verifiedStatus: !(account.verified === 1 || account.verified === true) && (account.status === 'pending' || account.verified_request) ? 'pending' : undefined,
      tiktok_code: account.verification_code || account.tiktok_code || "", // Usar el código proporcionado por el backend
      verified_request: account.created_at || account.verified_request || undefined, // Usar timestamp de solicitud
      verified_att: account.verified_att !== undefined ? (typeof account.verified_att === 'number' ? account.verified_att : parseInt(account.verified_att, 10) || 0) : 0, // Usar intentos del backend, si existen
    }));
  } catch (error: any) {
    console.error('Error en fetchTikTokAccountsFromNewApi:', error);
    throw error; // Re-lanzar para que el componente lo maneje
  }
};

/**
* Solicita la verificación de una cuenta de TikTok (inicial o reenviar código)
* Endpoint /verify con método POST. Puede requerir diferentes datos según la acción.
* @param data Objeto con los datos a enviar (username, account_id, verification_code, etc.)
* @returns Promise con el resultado de la verificación
*/
export const requestTikTokVerification = async (
  data: {
    account_id?: string; // ID de la cuenta
    username: string; // Nombre de usuario (sin @)
    verification_code?: string; // Código si se envía manualmente
    follower_count?: number; // Seguidores (para solicitud inicial si es necesario)
    profile_url?: string; // URL (para solicitud inicial si es necesario)
    set?: string; // Indicador de acción (ej. '1' para reinicio)
    status?: 'pending' | 'verified'; // Estado (ej. 'pending' para solicitud inicial)
  }
): Promise<VerificationResponse> => {
  const apiUrl = VERIFY_URL; // 'https://contabl.net/kleep/api/tiktok-accounts/verify'

  try {
    // Obtener el token de autenticación o lanzar error
    const authToken = getAuthTokenOrThrow();

    // Asegurar que el username no contenga @ al inicio antes de enviar
    const cleanUsername = data.username.startsWith('@') ? data.username.substring(1) : data.username;

    // Construir el cuerpo de la petición
    const requestBody = {
      ...data, // Incluir datos pasados como parámetro
      username: cleanUsername, // Usar el username limpio
      account: cleanUsername, // Algunas APIs usan 'account' en lugar de 'username'
      // Otros campos que tu API pueda esperar (ej. status: 'pending' para solicitud inicial)
      ...(data.set !== '1' && !data.verification_code && { status: 'pending' }), // Añadir status: pending si es solicitud inicial/sin código
      // Asegurar campos con nombres alternativos si la API los espera
      ...(data.verification_code && { code: data.verification_code }) // Si hay verification_code, añadir también 'code'
    };

    // Intentar hacer la petición POST con autenticación
    let response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    // --- Lógica de Reintento para 401 ---
    if (response.status === 401) {
      console.warn('401 en requestTikTokVerification, intentando formatos alternativos.');
      // Intentar con token sin Bearer
      response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': authToken }, body: JSON.stringify(requestBody) });

      // Si sigue fallando, intentar con query param
      if (response.status === 401) {
        console.warn('401 persistente, intentando con query param.');
        response = await fetch(`${apiUrl}?api_token=${encodeURIComponent(authToken)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(requestBody) });
      }
    }
    // --- Fin Lógica de Reintento ---

    // Manejar error 401 final
    if (response.status === 401) {
      throw new Error('Error 401: No autorizado. Tu sesión ha expirado.');
    }

    // Manejar error 422
    if (response.status === 422) {
      try {
        const errorData = await response.json();
        let errorMessage = 'Datos de solicitud de verificación rechazados por el servidor.';
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.errors) errorMessage = Object.values(errorData.errors).flat().join(', ');
        throw new Error(`Error 422: ${errorMessage}`);
      } catch (e) {
        throw new Error('Error 422: El servidor no pudo procesar la solicitud. Verifica los datos enviados.');
      }
    }

    if (!response.ok) {
      throw new Error(`Error en la solicitud de verificación (requestTikTokVerification): ${response.status} ${response.statusText || ''}`);
    }

    const responseData = await response.json();

    // Asumir que la respuesta incluye el código de verificación y possibly account info
    const verificationCode = responseData.verification_code || responseData.tiktok_code || responseData.code || data.verification_code || "";
    const backendAccount = responseData.account; // Información de cuenta si viene en la respuesta

    return {
      success: responseData.success || true, // Asumir éxito si response.ok
      message: responseData.message || 'Solicitud procesada.',
      account: backendAccount ? { // Transformar info de cuenta si está presente
        id: String(backendAccount.id || backendAccount.account_id || data.account_id || ''),
        account_id: String(backendAccount.id || backendAccount.account_id || data.account_id || ''),
        username: backendAccount.username || backendAccount.account || data.username || '',
        isVerified: backendAccount.verified === 1 || backendAccount.verified === true,
        verifiedStatus: !(backendAccount.verified === 1 || backendAccount.verified === true) && (backendAccount.status === 'pending' || backendAccount.verified_request) ? 'pending' : undefined,
        tiktok_code: backendAccount.verification_code || backendAccount.tiktok_code || verificationCode,
        verified_request: backendAccount.created_at || backendAccount.verified_request || undefined,
        verified_att: backendAccount.verified_att !== undefined ? (typeof backendAccount.verified_att === 'number' ? backendAccount.verified_att : parseInt(backendAccount.verified_att, 10) || 0) : 0,
      } : undefined,
      verification_code: verificationCode, // Devolver el código obtenido
    };
  } catch (error: any) {
    console.error('Error en requestTikTokVerification:', error);
    throw error; // Re-lanzar el error
  }
};


/**
* Solicita la verificación de una NUEVA cuenta de TikTok
* (Parece que este endpoint es similar a /verify pero para añadir cuentas nuevas y solicitar el primer código)
* Podría ser redundante si /verify maneja ambos casos.
* @deprecated Considerar fusionar con requestTikTokVerification si el backend lo permite
*/
export const requestTikTokAccountVerification = async (username: string, followerCount: number, profileUrl: string): Promise<{ success: boolean; message: string; account?: TikTokAccount; verification_code?: string }> => {
  // Reutilizamos la lógica de requestTikTokVerification si es posible, asumiendo que /verify lo maneja
  // Si /verify requiere un endpoint diferente para nuevas cuentas, se necesitaría otra URL aquí.
  try {
    const result = await requestTikTokVerification({
      username,
      follower_count: followerCount,
      profile_url: profileUrl.includes('@') ? profileUrl : `https://www.tiktok.com/@${username.startsWith('@') ? username.substring(1) : username}`,
      status: 'pending' // Asumir que la solicitud inicial establece el estado a pendiente
    });

    // Adaptar la respuesta al formato esperado por esta función si es necesario
    return {
      success: result.success,
      message: result.message,
      account: result.account, // El account object del backend transformado
      verification_code: result.verification_code, // El código devuelto
    };
  } catch (error: any) {
    console.error('Error en requestTikTokAccountVerification:', error);
    throw error;
  }
};


/**
* Verifica el estado actual de las cuentas pendientes llamando a la API REAL.
* *** UTILIZA EL ENDPOINT /verify, ASUMIENDO QUE EL BACKEND INTERPRETA LA PETICIÓN COMO CHECK DE ESTADO ***
* @param accountIds Array de IDs de cuentas a verificar
* @returns Promise con las cuentas actualizadas (con el estado real del backend)
*/
export const checkVerificationStatus = async (accountIds: string[]): Promise<TikTokAccount[]> => {
  try {
      if (!accountIds || accountIds.length === 0) {
          return []; // No hay IDs para verificar, retornar array vacío
      }

      // *** USAMOS EL ENDPOINT PRINCIPAL DE VERIFICACIÓN: https://contabl.net/kleep/api/tiktok-accounts/verify ***
      const apiUrl = VERIFY_URL;


      // Obtener el token de autenticación o lanzar error
      const authToken = getAuthTokenOrThrow();

      // *** ASUNCIÓN CLAVE: Backend verifica estado en /verify POST con account_ids array ***
      // DEBES CONFIRMAR CON TU BACKEND cómo solicitar el estado actual para múltiples IDs.
      // Si tu API requiere otro formato o método (ej. GET con query params), AJUSTA AQUÍ.
      // --- Posibles alternativas (ajustar requestData y method si es necesario): ---
      // 1. GET con IDs en query params: `${apiUrl}?account_ids[]=${accountIds.join('&account_ids[]=')}`
      // 2. POST con { ids: accountIds }: { ids: accountIds }
      // 3. POST con un parámetro específico: { account_ids: accountIds, action: 'check_status' }
      // --- Estamos usando la opción 1 del listado (POST con account_ids array) ---
      const requestData = {
          account_ids: accountIds // Asumimos que el backend espera un campo 'account_ids' con los IDs en POST
      };

      // Intentar hacer la petición POST con autenticación
      // Incluir lógica de reintento para 401 similar a otras funciones
      let response = await fetch(apiUrl, {
          method: 'POST', // Asumimos POST para enviar IDs en body para check de estado. Ajusta si es GET.
          headers: {
              'Content-Type': 'application/json', // Si envías body (para POST)
              'Accept': 'application/json',
              'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
          },
          body: JSON.stringify(requestData), // Enviar body si el método es POST
      });

      // --- Lógica de Reintento para 401 ---
      if (response.status === 401) {
          console.warn('401 en checkVerificationStatus (a verify endpoint), intentando formatos alternativos.');
          response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': authToken }, body: JSON.stringify(requestData) });
          if (response.status === 401) {
              console.warn('401 persistente, intentando con query param.');
              response = await fetch(`${apiUrl}?api_token=${encodeURIComponent(authToken)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(requestData) });
          }
      }
      // --- Fin Lógica de Reintento ---

      // Manejar error 401 final
      if (response.status === 401) {
          throw new Error('Error 401: No autorizado. Tu sesión ha expirado.');
      }

      if (!response.ok) {
          // Manejar otros errores HTTP
          throw new Error(`Error al verificar estado de cuentas (checkVerificationStatus): ${response.status} ${response.statusText || ''}`);
      }

      // *** Asumimos que la respuesta exitosa TIENE ESTA ESTRUCTURA para un check de estado múltiple ***
      // { success: boolean, accounts: CuentaBackendActualizada[] }
      // AJUSTA EL MAPEO ABAJO SI LA ESTRUCTURA REAL ES DIFERENTE.
      const data = await response.json();

      if (!data.success || !Array.isArray(data.accounts)) {
          // La respuesta no tiene el formato esperado (success: true y accounts array)
          throw new Error('Formato de respuesta de verificación de estado inválido (checkVerificationStatus).');
      }

      // Transformar los datos actualizados del backend al formato de la UI
      return data.accounts.map((account: any) => ({
          // Mapear los campos según la estructura REAL que devuelve tu backend para el estado
          id: String(account.id), // El ID debe coincidir para que el componente pueda actualizar el estado
          account_id: String(account.id), // Usar el mismo ID del backend, asegurar string
          username: account.username || account.account || '',
          isVerified: account.verified === 1 || account.verified === true, // Asumir 'verified' como 1 o true
          // Determinar verifiedStatus: 'pending' si no está verificado Y el estado es 'pending' en backend
          verifiedStatus: !(account.verified === 1 || account.verified === true) && (account.status === 'pending' || account.verified_request) ? 'pending' : undefined, // Ajusta si tu backend usa otro campo/valor para pendiente
          tiktok_code: account.verification_code || account.tiktok_code || '', // Código si sigue pendiente
          verified_request: account.created_at || account.verified_request || undefined, // Timestamp de la solicitud
          // verified_att puede que no venga en esta respuesta, el componente lo maneja localmente
          // Si el backend sí devuelve intentos, mapear aquí:
          verified_att: account.verified_att !== undefined ? (typeof account.verified_att === 'number' ? account.verified_att : parseInt(account.verified_att, 10) || 0) : undefined, // O undefined si el backend no lo manda
      }));

    } catch (error: any) {
        console.error('Error en checkVerificationStatus:', error);
        // En caso de error al verificar estado, retornar array vacío o re-lanzar dependiendo de cómo quieras manejarlo en la UI
        // throw error; // Puedes re-lanzar para que el componente muestre un error
        return []; // O retornar vacío para que no se actualicen las cuentas
    }
};


/**
 * Reinicia el proceso de verificación para una cuenta específica
 * Llama al endpoint /verify con método POST y set=1.
 * @param accountId ID de la cuenta a reiniciar
 * @param username Nombre de usuario de TikTok
 * @returns Promise con el resultado del reinicio
 */
export const resetTikTokVerification = async (
  accountId: string, // Aseguramos que accountId es string
  username: string = ''
): Promise<VerificationResponse> => {
  const apiUrl = VERIFY_URL; // 'https://contabl.net/kleep/api/tiktok-accounts/verify'

  try {
      if (!accountId) {
          throw new Error('ID de cuenta no proporcionado para reiniciar.');
      }

      // Obtener el token de autenticación
      const authToken = getAuthTokenOrThrow();

      // Asegurar que el username no contenga @ al inicio
      const cleanUsername = username.startsWith('@') ? username.substring(1) : username;

      // Datos a enviar para reinicio con set=1
      const resetData = {
          account: cleanUsername,      // Nombre de usuario de TikTok (limpio)
          set: "1",                    // Indicar reinicio
          account_id: accountId        // ID de la cuenta específica
      };

      // Hacer la petición POST con autenticación
      // Incluir lógica de reintento para 401
      let response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
          },
          body: JSON.stringify(resetData)
      });

      // --- Lógica de Reintento para 401 ---
      if (response.status === 401) {
        console.warn('401 en resetTikTokVerification, intentando formatos alternativos.');
        response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': authToken }, body: JSON.stringify(resetData) });
        if (response.status === 401) {
          console.warn('401 persistente, intentando con query param.');
          response = await fetch(`${apiUrl}?api_token=${encodeURIComponent(authToken)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(resetData) });
        }
      }
      // --- Fin Lógica de Reintento ---

      // Manejar error 401 final
      if (response.status === 401) {
          throw new Error('Error 401: No autorizado. Tu sesión ha expirado.');
      }

      if (!response.ok) {
          throw new Error(`Error al reiniciar verificación (resetTikTokVerification): ${response.status} ${response.statusText || ''}`);
      }

      // Asumimos que la respuesta exitosa indica el reinicio y devuelve información de la cuenta actualizada
      const responseData = await response.json();

      // Asumir que la respuesta incluye el código de verificación si se generó uno nuevo
      const verificationCode = responseData.verification_code || responseData.tiktok_code || responseData.code || "";

      // Asumir que la respuesta incluye información de la cuenta actualizada
      const backendAccount = responseData.account || responseData; // Intentar usar el objeto 'account' o la respuesta completa

      if (!backendAccount) {
        console.warn('Respuesta de reinicio exitosa, pero sin datos de cuenta actualizada.');
      }

      // Crear una respuesta de éxito con la información de la cuenta actualizada
      const accountResponse: TikTokAccount = {
          // Usar datos del backend si están disponibles, de lo contrario, usar los datos conocidos + estado reiniciado
          id: String(backendAccount?.id || backendAccount?.account_id || accountId),
          account_id: String(backendAccount?.id || backendAccount?.account_id || accountId),
          username: backendAccount?.username || backendAccount?.account || username || '',
          isVerified: backendAccount?.verified === 1 || backendAccount?.verified === true || false, // Debería ser falso al reiniciar
          verifiedStatus: !(backendAccount?.verified === 1 || backendAccount?.verified === true) && (backendAccount?.status === 'pending' || backendAccount?.verified_request) ? 'pending' : 'pending', // Debería ser 'pending' al reiniciar
          tiktok_code: backendAccount?.verification_code || backendAccount?.tiktok_code || verificationCode || '', // Usar el nuevo código si se generó
          verified_request: backendAccount?.created_at || backendAccount?.verified_request || new Date().toISOString(), // Nueva marca de tiempo de solicitud
          verified_att: backendAccount?.verified_att !== undefined ? (typeof backendAccount.verified_att === 'number' ? backendAccount.verified_att : parseInt(backendAccount.verified_att, 10) || 0) : 0, // Reiniciar intentos
      };

      return {
          success: responseData.success || true, // Asumir éxito si response.ok
          message: responseData.message || 'Proceso de verificación reiniciado.',
          account: accountResponse // Devolver la información de la cuenta actualizada
      };
    } catch (error: any) {
      console.error('Error en resetTikTokVerification:', error);
      throw error;
    }
};

/**
 * Obtiene las cuentas de TikTok no verificadas desde la API
 * Requiere autenticación. Llama a /kleep/api/tiktok-accounts/unverified.
 * @returns Promise con las cuentas no verificadas
 */
export const fetchUnverifiedTikTokAccounts = async (): Promise<TikTokAccount[]> => {
  const apiUrl = 'https://contabl.net/kleep/api/tiktok-accounts/unverified';

  try {
    // Obtener el token de autenticación o lanzar error
    const authToken = getAuthTokenOrThrow();

    // Intentar primero con Bearer token
    let response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
      },
    });

    // --- Lógica de Reintento para 401 ---
    if (response.status === 401) {
      console.warn('401 en fetchUnverifiedTikTokAccounts, intentando formatos alternativos.');
      response = await fetch(apiUrl, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': authToken } });
      if (response.status === 401) {
        console.warn('401 persistente, intentando con query param.');
        response = await fetch(`${apiUrl}?api_token=${encodeURIComponent(authToken)}`, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } });
      }
    }
    // --- Fin Lógica de Reintento ---

    // Manejar error 401 final
    if (response.status === 401) {
      throw new Error('Error 401: No autorizado. Tu sesión ha expirado.');
    }

    if (!response.ok) {
      throw new Error(`Error al cargar cuentas no verificadas (fetchUnverifiedTikTokAccounts): ${response.status} ${response.statusText || ''}`);
    }

    const data = await response.json();

    // Asumir que la respuesta tiene { success: boolean, accounts: CuentaBackend[] }
    if (!data.success || !Array.isArray(data.accounts)) {
      throw new Error('Formato de respuesta inválido (fetchUnverifiedTikTokAccounts).');
    }

    // Transformar los datos al formato que necesita la UI
    return data.accounts.map((account: any) => ({
      id: String(account.id), // Asegurar que sea string
      account_id: String(account.id), // Usar el mismo ID del backend, asegurar string
      username: account.username || account.account || '',
      isVerified: account.verified === 1 || account.verified === true, // Aunque son "unverified", el backend podría mandar el estado
      // Determinar verifiedStatus: 'pending' si no está verificado Y el estado es 'pending' en backend
      verifiedStatus: !(account.verified === 1 || account.verified === true) && (account.status === 'pending' || account.verified_request) ? 'pending' : 'unverified', // Establecer como 'unverified' si no es pendiente/verificada
      tiktok_code: account.verification_code || account.tiktok_code || "", // Código si aplica
      verified_request: account.created_at || account.verified_request || undefined, // Timestamp de solicitud
      verified_att: account.verified_att !== undefined ? (typeof account.verified_att === 'number' ? account.verified_att : parseInt(account.verified_att, 10) || 0) : 0, // Intentos
    }));
  } catch (error: any) {
    console.error('Error en fetchUnverifiedTikTokAccounts:', error);
    throw error;
  }
};


// Exportar todas las funciones para que estén disponibles
export default {
  fetchTikTokAccounts,
  fetchTikTokAccountsFromNewApi,
  requestTikTokVerification,
  requestTikTokAccountVerification, // Mantener si se usa específicamente para añadir nuevas cuentas
  checkVerificationStatus, // Implementación real que llama a la API
  resetTikTokVerification,
  fetchUnverifiedTikTokAccounts
};