import api from './axios';

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

/**
 * Inicializa el servicio de autenticación cargando los correos electrónicos guardados
 */
export const initAuthService = (): void => {
  try {
    const storedEmails = localStorage.getItem(STORED_EMAILS_KEY);
    if (storedEmails) {
      const emailsArray = JSON.parse(storedEmails) as string[];
      emailsArray.forEach(email => {
        if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
          ALLOWED_EMAILS.push(email.toLowerCase());
        }
      });
    }
  } catch (error) {
    // Error handling
  }
};

/**
 * Agrega un nuevo correo electrónico a la lista de permitidos
 */
export const addAllowedEmail = (email: string): void => {
  const normalizedEmail = email.toLowerCase();
  
  if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
    ALLOWED_EMAILS.push(normalizedEmail);
    try {
      localStorage.setItem(STORED_EMAILS_KEY, JSON.stringify(ALLOWED_EMAILS));
    } catch (error) {
      // Error handling
    }
  }
};

/**
 * Verifica si un correo electrónico está permitido
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
 */
export const sendVerificationCode = async (
  userId: string,
  email: string
): Promise<{ success: boolean; message: string; newCode?: string }> => {
  try {
    if (!userId || !email) {
      throw new Error('ID de usuario y correo electrónico son requeridos');
    }

    const response = await api.post('/nova/send-code', {
      id_user: userId,
      email: email
    });

    const responseData = response.data;
    
    let newCode = responseData.email_code;

    if (!newCode && responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
      newCode = responseData.data[0].email_code;
    }

    if (!newCode) {
      const findCode = (obj: any): string | undefined => {
        if (!obj || typeof obj !== 'object') return undefined;

        for (const key in obj) {
          if (key.toLowerCase().includes('code') || key.toLowerCase().includes('codigo') || key.toLowerCase().includes('código')) {
            if (obj[key] && (typeof obj[key] === 'string' || typeof obj[key] === 'number')) {
              return String(obj[key]);
            }
          }

          if (typeof obj[key] === 'object') {
            const found = findCode(obj[key]);
            if (found) return found;
          }
        }

        return undefined;
      };

      newCode = findCode(responseData);
    }

    if (newCode) {
      try {
        const apiResponseStr = localStorage.getItem('apiResponse');
        let apiResponse: any;

        if (apiResponseStr) {
          try {
            apiResponse = JSON.parse(apiResponseStr);
          } catch (e) {
            apiResponse = { data: [{ user_id: userId }] };
          }
        } else {
          apiResponse = { data: [{ user_id: userId }] };
        }

        if (apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
          apiResponse.data[0].email_code = newCode;
        } else {
          apiResponse.data = [{ user_id: userId, email_code: newCode }];
        }

        apiResponse.email_code = newCode;
        localStorage.setItem('apiResponse', JSON.stringify(apiResponse));
      } catch (storageError) {
        // Error handling
      }
    }

    return {
      success: true,
      message: responseData.message || 'Código enviado correctamente',
      newCode: newCode
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error al enviar el código de verificación'
    };
  }
};

/**
 * Obtiene los datos de "video to pay" para un usuario específico
 */
export const getVideoToPay = async (email: string) => {
  try {
    const response = await api.get('/nova/get-videos-to-pay', {
      params: { email }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.message || "No se pudo obtener la data del usuario");
  }
};

// Inicializar el servicio al importar el módulo
initAuthService();

export default {
  ALLOWED_EMAILS,
  isEmailAllowed,
  addAllowedEmail,
  logout,
  sendVerificationCode,
  getVideoToPay
};
