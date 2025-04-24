import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../components/ui/Form.css';
import { LogoIcon } from '../../components/icons';
import { sendVerificationCode, getVideoToPay } from '../../services/authService';

// Define status enum for better state management
type VerificationStatus = 'idle' | 'verifying' | 'sending' | 'success' | 'error';

const VerifyCode: React.FC = () => {
  // Estado del código y entrada del usuario
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [email, setEmail] = useState<string>('');
  const [emailMasked, setEmailMasked] = useState<string>('');
  
  // Estado de la UI mejorado con enum
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  
  // Estado del código esperado y datos de API
  const [apiData, setApiData] = useState<any>(null);
  
  // Estado de partículas
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const [particlesScriptLoaded, setParticlesScriptLoaded] = useState(false);

  // Referencias
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particlesContainer = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  // Inicializar array de referencias para los inputs
  if (inputRefs.current.length !== 6) {
    inputRefs.current = Array(6).fill(null);
  }

  // Efecto para cargar los datos iniciales y configurar partículas
  useEffect(() => {
    // Recuperar correo y datos de API
    const storedEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    const isRegistering = localStorage.getItem('isRegistering') === 'true';
    
    if (!storedEmail) {
      // Eliminar console.error
      // console.error('No email found in storage');
      navigate('/signin');
      return;
    }
    
    setEmail(storedEmail);
    setIsRegistering(isRegistering);
    
    // Crear versión enmascarada del email para mostrar
    const atIndex = storedEmail.indexOf('@');
    if (atIndex > 1) {
      const username = storedEmail.substring(0, atIndex);
      const domain = storedEmail.substring(atIndex);
      
      // Mostrar solo primer y último carácter del nombre de usuario
      const maskedUsername = username.charAt(0) + 
        '*'.repeat(Math.max(1, username.length - 2)) + 
        (username.length > 1 ? username.charAt(username.length - 1) : '');
      
      setEmailMasked(maskedUsername + domain);
    } else {
      setEmailMasked(storedEmail);
    }
    
    // Ya no guardamos el código en localStorage, usaremos la API para verificar
    // La API se encargará de verificar si el código enviado es correcto

    // Establecer foco en primer campo
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 500);

    // Limpiar timeouts al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [navigate]);

  // Efecto para inicializar partículas
  useEffect(() => {
    if (particlesScriptLoaded && typeof (window as any).particlesJS !== 'undefined') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        try {
          (window as any).particlesJS("particles-js", {
            particles: {
              number: {
                value: 100,
                density: {
                  enable: true,
                  value_area: 800,
                },
              },
              color: {
                value: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
              },
              shape: {
                type: ["star", "circle", "triangle", "polygon"],
                stroke: {
                  width: 0,
                  color: "#000000",
                },
                polygon: {
                  nb_sides: 5,
                },
              },
              opacity: {
                value: 0.7,
                random: true,
                anim: {
                  enable: true,
                  speed: 1,
                  opacity_min: 0.1,
                  sync: false,
                },
              },
              size: {
                value: 4,
                random: true,
                anim: {
                  enable: true,
                  speed: 2,
                  size_min: 0.1,
                  sync: false,
                },
              },
              line_linked: {
                enable: true,
                distance: 150,
                color: "#8b5cf6",
                opacity: 0.3,
                width: 1,
              },
              move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false,
                attract: {
                  enable: true,
                  rotateX: 600,
                  rotateY: 1200,
                },
              },
            },
            interactivity: {
              detect_on: "canvas",
              events: {
                onhover: {
                  enable: true,
                  mode: "bubble",
                },
                onclick: {
                  enable: true,
                  mode: "push",
                },
                resize: true,
              },
              modes: {
                grab: {
                  distance: 140,
                  line_linked: {
                    opacity: 1,
                  },
                },
                bubble: {
                  distance: 200,
                  size: 6,
                  duration: 2,
                  opacity: 0.8,
                  speed: 3,
                },
                repulse: {
                  distance: 200,
                  duration: 0.4,
                },
                push: {
                  particles_nb: 4,
                },
                remove: {
                  particles_nb: 2,
                },
              },
            },
            retina_detect: true,
          });
        } catch (error) {
        }
      }, 100);
    }
  }, [particlesScriptLoaded]);
  
  // Efecto para verificar código completo
  useEffect(() => {
    const isCodeComplete = code.every(digit => digit !== '');
    if (isCodeComplete && code.length === 6) {
      verifyCode();
    }
  }, [code]);

  // Verificar el código ingresado
  const verifyCode = async () => {
    if (status === 'verifying') return;
    
    setStatus('verifying');
    setErrorMessage(null);
  
    try {
      const enteredCode = code.join('').trim();
  
      if (enteredCode.length !== 6) {
        setErrorMessage('Por favor, ingrese el código de 6 dígitos completo.');
        setStatus('idle');
        return;
      }
  
      // Enviamos el código al backend para su verificación
      const response = await fetch("https://contabl.net/kleep/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email,
          code: enteredCode 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error en la verificación: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success || data.verified || data.status === 'success') {
        setStatus('success');
        setSuccessMessage('¡Código verificado correctamente! Redirigiendo...');
        
        // Guardar información de autenticación
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.removeItem('isRegistering');
        
        // Si la respuesta de la API incluye un token, lo guardamos
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        
        // Redirigir a la página de signup después de verificar el código
        timeoutRef.current = setTimeout(() => {
          navigate('/campaign-home');
        }, 1500);
      } else {
        setErrorMessage('Código de verificación incorrecto. Por favor, revise e intente de nuevo.');
        setCode(Array(6).fill(''));
        inputRefs.current[0]?.focus();
        setStatus('idle');
      }
    } catch (error: any) {
      setErrorMessage(`Ocurrió un error al verificar el código: ${error.message}`);
      setStatus('error');
      
      // Si hubo un error de conexión o servidor, permitir otro intento
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();
      setTimeout(() => setStatus('idle'), 1000);
    }
  };
  
  // Reenviar código de verificación
  const handleResendCode = async () => {
    if (status === 'sending') return;
    
    setStatus('sending');
    setErrorMessage(null);
    setSuccessMessage(null);
  
    try {
      // Solicitar nuevo código con email directamente
      
      const response = await fetch("https://contabl.net/kleep/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.status}`);
      }
      
      const data = await response.json();
      
      setSuccessMessage('✅ Código reenviado correctamente. Revisa tu correo electrónico.');
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      setErrorMessage(`Error al reenviar el código: ${error.message}`);
      setStatus('error');
    } finally {
      if (status !== 'error') {
        setStatus('idle');
      }
    }
  };

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    // Solo permitir dígitos
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    // Actualizar el estado del código
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setErrorMessage(null);

    // Mover foco al siguiente input si está lleno
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Manejar teclas especiales
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Retroceder al input anterior con backspace en input vacío
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Volver a la página anterior
  const handleBackClick = () => {
    navigate(isRegistering ? '/signup' : '/signin');
  };

  // Renderizado del componente
  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-4 relative w-full h-screen overflow-hidden">
      <div id="particles-js" ref={particlesContainer} className="absolute inset-0 z-0">
        {particlesLoaded && <ParticlesBackground containerRef={particlesContainer} />}
      </div>

      <div className="verification-container card w-full relative z-10 bg-[rgba(25,25,25,0.85)] backdrop-blur-md rounded-xl shadow-lg border border-[rgba(51,51,51,0.2)] overflow-hidden" style={{ maxWidth: '400px', borderRadius: '8px' }}>
        <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[#8b5cf6] to-[#c084fc]"></div>
        
        <div className="logo mt-4 text-center">
          <LogoIcon width={40} height={40} className="mx-auto" />
        </div>

        <h2 className="text-white text-center mt-4 text-xl sm:text-2xl font-bold">
          {isRegistering ? '¡Bienvenido a Clipper!' : '¡Bienvenido de nuevo!'}
        </h2>

        <p className="text-[#aaa] text-center mb-6 text-sm sm:text-base mt-2">
          {isRegistering
            ? 'Ingrese el código para verificar su cuenta'
            : 'Ingrese el código que recibió en su correo electrónico'
          }
          <br />
          <strong className="text-white block mt-1">
            {emailMasked}
          </strong>
        </p>

        {/* Mensajes de estado */}
        {errorMessage && (
          <div className="text-red-500 text-sm text-center mb-4">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="text-green-500 text-sm text-center mb-4">
            {successMessage}
          </div>
        )}

        {/* Inputs para el código */}
        <div className="code-input flex justify-center mb-6 px-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              className={`w-10 h-10 sm:w-12 sm:h-12 mx-1 text-center text-lg sm:text-xl bg-[#0c0c0c] border ${errorMessage ? 'border-red-500' : 'border-[#333]'} text-white`}
              maxLength={1}
              value={code[index]}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={{ borderRadius: '8px' }}
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={status === 'verifying' || status === 'success'}
            />
          ))}
        </div>

        {/* Botón de volver */}
        <button
          onClick={handleBackClick}
          className="btn-back text-white bg-transparent border-0 cursor-pointer flex items-center justify-center w-full mb-2 text-sm sm:text-base"
          disabled={status === 'verifying' || status === 'success'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        {/* Botón de reenvío */}
        <div className="no-code text-center mt-2 mb-4">
          <button
            className="text-white hover:underline text-sm sm:text-base"
            onClick={handleResendCode}
            disabled={status === 'sending' || status === 'verifying' || status === 'success'}
          >
            {status === 'sending' ? 'Enviando...' : 'No recibí un código - Reenviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para renderizar el fondo de partículas
function ParticlesBackground({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  useEffect(() => {
    const interval = setInterval(() => {
      if ((window as any).particlesJS && containerRef.current) {
        (window as any).particlesJS("particles-js", {
          particles: {
            number: { value: 100, density: { enable: true, value_area: 800 } },
            color: { value: ["#8b5cf6", "#a78bfa", "#c4b5fd"] },
            shape: {
              type: ["star", "circle", "triangle", "polygon"],
              stroke: { width: 0, color: "#000000" },
              polygon: { nb_sides: 5 },
            },
            opacity: {
              value: 0.7,
              random: true,
              anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false },
            },
            size: {
              value: 4,
              random: true,
              anim: { enable: true, speed: 2, size_min: 0.1, sync: false },
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: "#8b5cf6",
              opacity: 0.3,
              width: 1,
            },
            move: {
              enable: true,
              speed: 2,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
              attract: { enable: true, rotateX: 600, rotateY: 1200 },
            },
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: { enable: true, mode: "bubble" },
              onclick: { enable: true, mode: "push" },
              resize: true,
            },
            modes: {
              grab: { distance: 140, line_linked: { opacity: 1 } },
              bubble: {
                distance: 200,
                size: 6,
                duration: 2,
                opacity: 0.8,
                speed: 3,
              },
              repulse: { distance: 200, duration: 0.4 },
              push: { particles_nb: 4 },
              remove: { particles_nb: 2 },
            },
          },
          retina_detect: true,
        });
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [containerRef]);

  return null;
}

export default VerifyCode;