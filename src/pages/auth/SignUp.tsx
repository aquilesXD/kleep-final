import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoIcon } from '../../components/icons';
import '../../components/ui/Form.css';
import { toast } from 'react-hot-toast';

// API endpoint for user creation
const API_USER_ENDPOINT = 'https://contabl.net/kleep/api/user';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [age, setAge] = useState<number | ''>('');
  const [country, setCountry] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isValidForm, setIsValidForm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [particlesScriptLoaded, setParticlesScriptLoaded] = useState(false);
  
  const navigate = useNavigate();
  const particlesContainer = useRef<HTMLDivElement>(null);

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    // Si el usuario ya completó todo el proceso de registro, redirigir
    if (isAuthenticated === 'true') {
      navigate('/campaign-home');
    }
    
    // Cargar el script de partículas
    if (typeof window !== "undefined" && !(window as any).particlesJS) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
      script.async = true;
      script.onload = () => {
        setParticlesScriptLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setParticlesScriptLoaded(true);
    }
  }, [navigate]);

  // Inicializar las partículas cuando el script esté cargado
  useEffect(() => {
    if (particlesScriptLoaded && typeof (window as any).particlesJS !== 'undefined') {
      setTimeout(() => {
        try {
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
                value: 0.7, random: true,
                anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false },
              },
              size: {
                value: 4, random: true,
                anim: { enable: true, speed: 2, size_min: 0.1, sync: false },
              },
              line_linked: {
                enable: true, distance: 150, color: "#8b5cf6", opacity: 0.3, width: 1,
              },
              move: {
                enable: true, speed: 2, direction: "none", random: true,
                straight: false, out_mode: "out", bounce: false,
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
                bubble: { distance: 200, size: 6, duration: 2, opacity: 0.8, speed: 3 },
                push: { particles_nb: 4 },
              },
            },
            retina_detect: true,
          });
        } catch (error) {
          console.error("Error al inicializar partículas:", error);
        }
      }, 100);
    }
  }, [particlesScriptLoaded]);

  // Validación del formulario
  useEffect(() => {
    setIsValidForm(
      email.trim().length > 0 &&
      name.trim().length > 0 && 
      username.trim().length > 0 &&
      (typeof age === 'number' || age.toString().trim() !== '') &&
      country.trim().length > 0 &&
      phone.trim().length > 0
    );
  }, [email, name, username, age, country, phone]);

  // Clases para los inputs
  const getInputClassName = () => {
    return `w-full py-3 px-4 bg-[rgba(28,28,28,0.7)] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78bfa] border border-[rgba(75,75,75,0.5)]`;
  };

  // Manejadores de cambios en los campos
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setError(null);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setError(null);
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAge(value === '' ? '' : parseInt(value, 10));
    setError(null);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCountry(e.target.value);
    setError(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setError(null);
  };

  // Enviar datos al servidor
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidForm) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Obtener token si existe
      const token = localStorage.getItem('token');
      
      // Preparar datos del formulario
      const formData = new FormData();
      formData.append('email', email.trim());
      formData.append('name', name.trim());
      formData.append('username', username.trim());
      
      if (typeof age === 'number' && !isNaN(age)) {
        formData.append('age', age.toString());
      } else if (typeof age === 'string' && age.trim() !== '') {
        formData.append('age', age.trim());
      }
      
      formData.append('country', country.trim());
      formData.append('phone', phone.trim());

      // Configurar headers
      const headers = new Headers();
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }

      // Enviar solicitud
      const response = await fetch(API_USER_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      // Procesar respuesta
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Error al parsear la respuesta como JSON:', e);
        responseData = { message: responseText || `Error en el servidor: ${response.status}` };
      }

      if (!response.ok) {
        throw new Error(responseData.message || `Error en el servidor: ${response.status}`);
      }

      // Manejo de respuesta exitosa
      if (responseData.token) {
        localStorage.setItem('token', responseData.token);
      }
      
      // Guardar info del usuario
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userId', responseData.id || responseData.user_id || '');
      localStorage.setItem('isAuthenticated', 'true');
      
      // Guardar datos básicos del usuario
      localStorage.setItem('userInfo', JSON.stringify({
        name,
        username,
        email,
        age,
        country,
        phone,
        has_profile_image: false
      }));

      // Notificar éxito
      toast.success('Usuario creado correctamente');
      
      // Redirigir
      navigate('/campaign-home');
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Error al crear el usuario');
      toast.error(error.message || 'Error al crear el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen flex justify-center items-center overflow-hidden bg-[#0c0c0c]">
      <div id="particles-js" ref={particlesContainer} className="absolute inset-0 z-0"></div>

      <div className="relative z-10 bg-[rgba(25,25,25,0.85)] backdrop-blur-md rounded-xl w-[90%] max-w-[500px] p-8 md:p-10 shadow-lg border border-[rgba(51,51,51,0.2)] overflow-hidden animate-fadeIn">
        <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[#8b5cf6] to-[#c084fc]"></div>

        <div className="text-center mb-6">
          <div className="logo mt-4 text-center">
            <LogoIcon width={40} height={40} className="mx-auto" />
          </div>
          <h2 className="text-white mt-4 text-xl sm:text-2xl font-bold">
            Crear cuenta
          </h2>
        </div>

        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              className={getInputClassName()}
              id="email"
              placeholder="Correo electrónico"
              type="email"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="mb-4">
            <input
              className={getInputClassName()}
              id="name"
              placeholder="Nombre completo"
              type="text"
              value={name}
              onChange={handleNameChange}
              disabled={isLoading}
              autoComplete="name"
              required
            />
          </div>

          <div className="mb-4">
            <input
              className={getInputClassName()}
              id="username"
              placeholder="Nombre de usuario"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              disabled={isLoading}
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-4">
            <input
              className={getInputClassName()}
              id="age"
              placeholder="Edad"
              type="number"
              value={age}
              onChange={handleAgeChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <input
              className={getInputClassName()}
              id="country"
              placeholder="País"
              type="text"
              value={country}
              onChange={handleCountryChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <input
              className={getInputClassName()}
              id="phone"
              placeholder="Teléfono"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              disabled={isLoading}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-1 mb-4">{error}</p>}
          
          <button
            className={`w-full py-4 bg-gradient-to-r from-[#8b5cf6] to-[#c084fc] text-white font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:from-[#7c3aed] hover:to-[#a855f7] ${!isValidForm || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="submit"
            disabled={!isValidForm || isLoading}
          >
            {isLoading ? 'Cargando...' : 'Continuar'}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-[#aaa]">
              ¿Ya tienes una cuenta? <Link to="/signin" className="text-[#a78bfa] hover:text-[#c4b5fd] font-medium">Iniciar sesión</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente simplificado para el fondo de partículas
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
              polygon: { nb_sides: 5 },
            },
            opacity: {
              value: 0.7, random: true,
              anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false },
            },
            size: {
              value: 4, random: true,
              anim: { enable: true, speed: 2, size_min: 0.1, sync: false },
            },
            line_linked: {
              enable: true, distance: 150, color: "#8b5cf6", opacity: 0.3, width: 1,
            },
            move: {
              enable: true, speed: 2, direction: "none", random: true,
              straight: false, out_mode: "out", bounce: false,
            },
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: { enable: true, mode: "bubble" },
              onclick: { enable: true, mode: "push" },
              resize: true,
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

export default SignUp;
