import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoIcon } from '../../components/icons';
import '../../components/ui/Form.css';
import { toast } from 'react-hot-toast';

const phoneFormats: Record<string, { prefix: string; maxLength: number; format: (value: string) => string }> = {
  Argentina: { prefix: '+54', maxLength: 10, format: (v) => `${v.slice(0, 2)} ${v.slice(2, 6)}-${v.slice(6, 10)}` },
  Bolivia: { prefix: '+591', maxLength: 8, format: (v) => `${v.slice(0, 4)}-${v.slice(4, 8)}` },
  Brasil: { prefix: '+55', maxLength: 11, format: (v) => `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7, 11)}` },
  Chile: { prefix: '+56', maxLength: 9, format: (v) => `${v.slice(0, 1)} ${v.slice(1, 5)} ${v.slice(5, 9)}` },
  Colombia: { prefix: '+57', maxLength: 10, format: (v) => `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 10)}` },
  'Costa Rica': { prefix: '+506', maxLength: 8, format: (v) => `${v.slice(0, 4)}-${v.slice(4, 8)}` },
  Cuba: { prefix: '+53', maxLength: 8, format: (v) => `${v.slice(0, 4)}-${v.slice(4, 8)}` },
  Ecuador: { prefix: '+593', maxLength: 9, format: (v) => `${v.slice(0, 2)}-${v.slice(2, 5)}-${v.slice(5, 9)}` },
  'El Salvador': { prefix: '+503', maxLength: 8, format: (v) => `${v.slice(0, 4)}-${v.slice(4, 8)}` },
  Guatemala: { prefix: '+502', maxLength: 8, format: (v) => `${v.slice(0, 4)}-${v.slice(4, 8)}` },
  Honduras: { prefix: '+504', maxLength: 8, format: (v) => `${v.slice(0, 4)}-${v.slice(4, 8)}` },
  México: { prefix: '+52', maxLength: 10, format: (v) => `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 10)}` },
  Nicaragua: { prefix: '+505', maxLength: 8, format: (v) => `${v.slice(0, 4)}-${v.slice(4, 8)}` },
  Panamá: { prefix: '+507', maxLength: 8, format: (v) => `${v.slice(0, 4)}-${v.slice(4, 8)}` },
  Paraguay: { prefix: '+595', maxLength: 9, format: (v) => `${v.slice(0, 3)}-${v.slice(3, 6)}-${v.slice(6, 9)}` },
  Perú: { prefix: '+51', maxLength: 9, format: (v) => `${v.slice(0, 3)}-${v.slice(3, 6)}-${v.slice(6, 9)}` },
  'Puerto Rico': { prefix: '+1', maxLength: 10, format: (v) => `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}` },
  'República Dominicana': { prefix: '+1', maxLength: 10, format: (v) => `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}` },
  Uruguay: { prefix: '+598', maxLength: 9, format: (v) => `${v.slice(0, 2)} ${v.slice(2, 5)} ${v.slice(5, 9)}` },
  Venezuela: { prefix: '+58', maxLength: 11, format: (v) => `${v.slice(0, 3)}-${v.slice(3, 10)}` },
  'Estados Unidos': { prefix: '+1', maxLength: 10, format: (v) => `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}` },
  Canadá: { prefix: '+1', maxLength: 10, format: (v) => `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}` },
  España: { prefix: '+34', maxLength: 9, format: (v) => `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 9)}` },
  Otro: { prefix: '+', maxLength: 15, format: (v) => v }
};


// API endpoint for user creation
const API_USER_ENDPOINT = 'https://contabl.net/kleep/api/auth/register';


const SignUp: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [isValidForm, setIsValidForm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [particlesScriptLoaded, setParticlesScriptLoaded] = useState(false);
  
  const navigate = useNavigate();
  const particlesContainer = useRef<HTMLDivElement>(null);

  // Cargar el script de partículas
  useEffect(() => {
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
  }, []);

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
      country.trim().length > 0 &&
      phone.replace(/\D/g, '').length > 0 &&
      age.trim().length > 0 &&
      parseInt(age) >= 18
    );
  }, [email, name, username, country, phone, age]);

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

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setCountry(selected);
    const digits = phone.replace(/\D/g, '');
    const maxLength = phoneFormats[selected]?.maxLength || 15;
    setPhone(digits.slice(0, maxLength));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value); // sin bloquear la edición
  };

  const handlePhoneBlur = () => {
    const formatConfig = phoneFormats[country] || phoneFormats['Otro'];
    const digits = phone.replace(/\D/g, '');
    const formatted = formatConfig.prefix + ' ' + formatConfig.format(digits);
    setPhone(formatted); // al salir, aplica el formato
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
  
    const numericAge = parseInt(value);
    if (numericAge > 100) value = '100';
  
    setAge(value);
    setError(null);
  };

  // Enviar datos al servidor
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidForm) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    if (parseInt(age) < 18) {
      setError('Debes tener al menos 18 años para registrarte');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Preparar datos del usuario con la nueva estructura
      const userData = {
        email: email.trim(),
        name: name.trim(),
        username: username.trim(),
        country: country.trim(),
        phone: phone.trim(),
        age: parseInt(age.trim())
      };

      // Enviar solicitud con la nueva estructura
      const response = await fetch(API_USER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Error en el servidor: ${response.status}`);
      }

      // Verificar si la respuesta fue exitosa
      if (responseData.success) {
        // Guardar datos relevantes en localStorage
        localStorage.setItem('userId', responseData.user_id.toString());
        localStorage.setItem('userEmail', responseData.user.email);
        localStorage.setItem('verification_expires_at', responseData.expires_at);
        
        // Mostrar mensaje de éxito indicando que revise su correo
        toast.success('Usuario creado correctamente. Por favor revisa tu correo electrónico para obtener el código de verificación.');
        
        // Redirigir a la página de verificación de código
        navigate('/verify-code', { 
          state: { 
            email: responseData.user.email,
            userId: responseData.user_id,
            expiresAt: responseData.expires_at
          }
        });
      } else {
        throw new Error(responseData.message || 'Error al crear el usuario');
      }
    } catch (error: any) {
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
          <p className="text-gray-400 mt-2 text-sm">
            Únete a nuestra comunidad y comienza a ganar dinero con tus videos
          </p>
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
            <select
              className={`${getInputClassName()} appearance-none w-full py-3 px-4 text-base`}
              id="country"
              value={country}
              onChange={handleCountryChange}
              disabled={isLoading}
              required
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: `right 0.5rem center`,
                backgroundRepeat: `no-repeat`,
                backgroundSize: `1.5em 1.5em`,
                paddingRight: `2.5rem`
              }}
            >
              <option value="">Selecciona un país</option>
              <option value="Argentina">Argentina</option>
              <option value="Bolivia">Bolivia</option>
              <option value="Brasil">Brasil</option>
              <option value="Chile">Chile</option>
              <option value="Colombia">Colombia</option>
              <option value="Costa Rica">Costa Rica</option>
              <option value="Cuba">Cuba</option>
              <option value="Ecuador">Ecuador</option>
              <option value="El Salvador">El Salvador</option>
              <option value="Guatemala">Guatemala</option>
              <option value="Honduras">Honduras</option>
              <option value="México">México</option>
              <option value="Nicaragua">Nicaragua</option>
              <option value="Panamá">Panamá</option>
              <option value="Paraguay">Paraguay</option>
              <option value="Perú">Perú</option>
              <option value="Puerto Rico">Puerto Rico</option>
              <option value="República Dominicana">República Dominicana</option>
              <option value="Uruguay">Uruguay</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Estados Unidos">Estados Unidos</option>
              <option value="Canadá">Canadá</option>
              <option value="España">España</option>
            </select>
          </div>

        <div className="w-full mb-4">
        <input
        type="tel"
        name="phone"
        id="phone"
        maxLength={phoneFormats[country]?.maxLength || 15}
        value={phone}
        onChange={handlePhoneChange}
        onBlur={handlePhoneBlur}
        inputMode="tel"
        placeholder="Ej: 4121234567"
        className={getInputClassName()}
         />
       </div>
       
          <div className="w-full mb-4">
            <input
              type="tel"
              name="age"
              id="age"
              value={age}
              onChange={handleAgeChange}
              inputMode="numeric"
              maxLength={3}
              placeholder="Edad"
              className={getInputClassName()}
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-1 mb-4">{error}</p>}
          
          <button
            className={`w-full py-4 bg-gradient-to-r from-[#8b5cf6] to-[#c084fc] text-white font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:from-[#7c3aed] hover:to-[#a855f7] ${!isValidForm || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="submit"
            disabled={!isValidForm || isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Registrarse'}
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
