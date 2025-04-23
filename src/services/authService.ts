// Lista de correos electrónicos permitidos
export const ALLOWED_EMAILS = [
  'usuario1@ejemplo.com',
  'usuario2@ejemplo.com',
  'admin@clipper.com',
  'test@clipper.com',
  'demo@clipper.com'
];

// Clave para almacenar los correos en localStorage
const STORED_EMAILS_KEY = 'clipper_registered_emails';
const API_BASE_URL = 'https://contabl.net';

/**
 * Inicializa el servicio de autenticación cargando los correos electrónicos guardados
 */
export const initAuthService = (): void => {
  try {
    // Intentar cargar correos registrados del localStorage
    const storedEmails = localStorage.getItem(STORED_EMAILS_KEY);
    if (storedEmails) {
      const emailsArray = JSON.parse(storedEmails) as string[];

      // Añadir los correos almacenados a la lista de permitidos (sin duplicados)
      emailsArray.forEach(email => {
        if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
          ALLOWED_EMAILS.push(email.toLowerCase());
        }
      });
    }
  } catch (error) {
    // Error al cargar los correos electrónicos
  }
};

/**
 * Agrega un nuevo correo electrónico a la lista de permitidos
 * @param email Correo electrónico a agregar
 */
export const addAllowedEmail = (email: string): void => {
  const normalizedEmail = email.toLowerCase();

  // Solo agregar si no existe ya
  if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
    ALLOWED_EMAILS.push(normalizedEmail);

    try {
      // Guardar en localStorage para persistencia
      localStorage.setItem(STORED_EMAILS_KEY, JSON.stringify(ALLOWED_EMAILS));
    } catch (error) {
      // Error al guardar el correo electrónico
    }
  }
};

/**
 * Verifica si un correo electrónico está permitido
 * @param email Correo electrónico a verificar
 * @returns true si el correo está permitido, false en caso contrario
 */
export const isEmailAllowed = (email: string): boolean => {
  return ALLOWED_EMAILS.includes(email.toLowerCase());
};

/**
 * Simula el cierre de sesión eliminando datos de autenticación
 */
export const logout = (): void => {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('apiResponse');
};

/**
 * Envía el código de verificación al correo electrónico del usuario
 * @param userId ID del usuario
 * @param email Correo electrónico del usuario
 * @returns Promise con el resultado del envío y el nuevo código si está disponible
 */
export const sendVerificationCode = async (
  userId: string,
  email: string
): Promise<{ success: boolean; message: string; newCode?: string }> => {
  try {

    if (!userId || !email) {
      throw new Error('ID de usuario y correo electrónico son requeridos');
    }

    // Datos a enviar al endpoint
    const sendCodeData = {
      id_user: userId,
      email: email
    };


    // Configurar headers
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    // Realizar la solicitud POST
    const response = await fetch('https://contabl.net/nova/send-code', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(sendCodeData)
    });

    // Procesar respuesta
    try {
      const responseData = await response.json();
    
      // Extraer el nuevo código de la respuesta si está disponible
      // Primero buscar en la raíz
      let newCode = responseData.email_code;

      // Luego buscar en data[0]
      if (!newCode && responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
        newCode = responseData.data[0].email_code;
      }

      // Si aún no hay código, intentar buscar recursivamente
      if (!newCode) {
        // Función recursiva para buscar el código en un objeto
        const findCode = (obj: any): string | undefined => {
          if (!obj || typeof obj !== 'object') return undefined;

          // Buscar propiedades que contengan "code" o "código"
          for (const key in obj) {
            if (key.toLowerCase().includes('code') || key.toLowerCase().includes('codigo') || key.toLowerCase().includes('código')) {
              if (obj[key] && (typeof obj[key] === 'string' || typeof obj[key] === 'number')) {
                return String(obj[key]);
              }
            }

            // Buscar recursivamente en objetos anidados
            if (typeof obj[key] === 'object') {
              const found = findCode(obj[key]);
              if (found) return found;
            }
          }

          return undefined;
        };

        newCode = findCode(responseData);
      }

      // Si no se encontró ningún código en la respuesta, no proporcionar uno
      if (!newCode) {
      } else {
        newCode = String(newCode);
      }

      // Actualizar el apiResponse en localStorage si tenemos un código
      if (newCode) {
        try {
          // Primero intentar obtener el apiResponse existente
          const apiResponseStr = localStorage.getItem('apiResponse');
          let apiResponse: any;

          if (apiResponseStr) {
            try {
              apiResponse = JSON.parse(apiResponseStr);
            } catch (e) {
              // Si hay error al parsear, crear un objeto nuevo
              apiResponse = { data: [{ user_id: userId }] };
            }
          } else {
            // Si no hay apiResponse, crear uno nuevo
            apiResponse = { data: [{ user_id: userId }] };
          }

          // Actualizar el código en apiResponse
          if (apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
            apiResponse.data[0].email_code = newCode;
          } else {
            // Si no hay estructura data, crear una
            apiResponse.data = [{ user_id: userId, email_code: newCode }];
          }

          // También actualizar en la raíz para mayor compatibilidad
          apiResponse.email_code = newCode;

          // Guardar en localStorage
          localStorage.setItem('apiResponse', JSON.stringify(apiResponse));
        } catch (storageError) {
        }
      }

      return {
        success: true,
        message: responseData.message || 'Código enviado correctamente',
        newCode: newCode
      };
    } catch (parseError) {

      return {
        success: response.ok,
        message: response.ok
          ? 'Código enviado correctamente'
          : 'Error al enviar el código de verificación'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error al enviar el código de verificación'
    };
  }
};

/**
 * Obtiene los datos de "video to pay" para un usuario específico
 * @param userId ID del usuario
 * @returns Promise con los datos de video to pay
 */
export const getVideoToPay = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/nova/get-videos-to-pay?email=${email}`);

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "No se pudo obtener la data del usuario");
  }
};
// Inicializar el servicio al importar el módulo
initAuthService();

// Export all functions
export default {
  ALLOWED_EMAILS,
  isEmailAllowed,
  addAllowedEmail,
  logout,
  sendVerificationCode,
  getVideoToPay
};
