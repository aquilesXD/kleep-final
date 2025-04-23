import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../components/ui/Form.css';
import { LogoIcon } from '../../components/icons';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      navigate('/profile-saldo');
    }
  }, [navigate]);

  // Función para validar formato de correo electrónico
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsValidEmail(validateEmail(value));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!isValidEmail) {
      setError('Por favor ingrese un correo electrónico válido');
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      const apiUrl = `https://contabl.net/nova/get-videos-to-pay?email=${encodeURIComponent(email)}`;
      const response = await fetch(apiUrl);
  
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`);
      }
  
      const responseData = await response.json();
  
      if (responseData?.data?.length > 0) {
        // Guardar en localStorage
        localStorage.setItem('userEmail', email);
        localStorage.setItem('apiResponse', JSON.stringify(responseData));
        localStorage.setItem('isRegistering', 'false');
  
        // Extraer userId
        const extractUserId = (data: any): string => {
          const user = data.data[0];
          return user.user_id || user.id_user || user.id || '';
        };
        const userId = extractUserId(responseData);
  
        if (!userId) throw new Error("No se pudo obtener el ID de usuario.");
  
        // Enviar código al correo
        const { sendVerificationCode } = await import('../../services/authService');
        await sendVerificationCode(userId, email);

// Esperar que el backend actualice
await new Promise((res) => setTimeout(res, 3000));

// Hacer nuevo GET para obtener el nuevo código actualizado
const refreshedResponse = await fetch(apiUrl);
const refreshedData = await refreshedResponse.json();

// Guardar el nuevo apiResponse con el código actualizado
localStorage.setItem('apiResponse', JSON.stringify(refreshedData));

navigate('/verify-code');
      } else {
        setError('Correo electrónico no encontrado en el sistema.');
      }
    } catch (error: any) {
      setError(`Error al iniciar sesión: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center max-w-5xl w-full">
        {/* Se ha eliminado el Logo Mini a un costado */}

        {/* Formulario de inicio de sesión */}
        <div className="login-container card w-full" style={{ maxWidth: '450px', borderRadius: '8px' }}>
          {/* Logo */}
          <div className="logo mt-4 text-center">
            <LogoIcon width={40} height={40} className="mx-auto" />
          </div>

          <h2 className="text-white w-100 mt-1 text-center text-2xl sm:text-3xl font-bold">
            Iniciar sesión
          </h2>

          <form className="mt-6 px-4 sm:px-6" onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                className={`form-control w-full p-2 sm:p-3 bg-[#191919] border ${error ? 'border-red-500' : 'border-[#333]'} text-white text-sm sm:text-base`}
                id="email"
                placeholder="Tu correo"
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                autoComplete="email"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <button
              className={`w-full mt-2 bg-[#7c3aed] text-white font-medium py-2 sm:py-3 px-4 text-sm sm:text-base ${!isValidEmail || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#6d28d9]'}`}
              type="submit"
              disabled={!isValidEmail || isLoading}
            >
              {isLoading ? 'Cargando...' : 'Continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
