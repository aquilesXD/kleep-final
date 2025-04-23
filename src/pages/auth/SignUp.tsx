import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../components/ui/Form.css';
import { toast } from 'react-hot-toast';

// API endpoint for user creation
const API_USER_ENDPOINT = 'https://contabl.net/kleep/api/user';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
  const [isValidForm, setIsValidForm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const particlesContainer = useRef<HTMLDivElement>(null);
  const [particlesScriptLoaded, setParticlesScriptLoaded] = useState(false);
  const navigate = useNavigate();

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      navigate('/campaign-home');
    }

    // Cargar el script de partículas si no está ya cargado
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
      // Pequeño retraso para asegurar que el DOM esté listo
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
          console.error("Error al inicializar partículas:", error);
        }
      }, 100);
    }
  }, [particlesScriptLoaded]);

  // Validar formulario completo cuando cambian los campos
  useEffect(() => {
    setIsValidForm(
      isValidEmail && 
      name.trim().length > 0 && 
      phone.trim().length > 0 && 
      country.trim().length > 0 && 
      city.trim().length > 0
    );
  }, [isValidEmail, name, phone, country, city]);

  // Función para validar correo electrónico
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

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      
      // Crear URL para previsualización
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  // Función para crear un nuevo usuario
  const createUserProfile = async (userData: FormData): Promise<any> => {
    // Configurar headers con token de autorización
    const headers = new Headers();
    
    // Obtener el token del localStorage (si existe)
    const token = localStorage.getItem('token');
    
    // Agregar token de autorización si existe
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }
    
    // Agregar Content-Type para los datos multipart
    // Nota: No agregar Content-Type manualmente cuando se usa FormData,
    // el navegador lo establece automáticamente con el boundary correcto

    // Log para depuración: mostrar todos los campos que se envían
    console.log('Campos enviados al servidor:');
    for (const pair of userData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
    
    console.log('Enviando datos al servidor:', {
      url: API_USER_ENDPOINT,
      method: 'POST',
      headers: Object.fromEntries(headers.entries()),
      formDataKeys: [...userData.keys()]
    });
    
    const response = await fetch(API_USER_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: userData,
    });

    const responseText = await response.text();
    console.log('Respuesta del servidor (texto):', responseText);
    console.log('Código de estado HTTP:', response.status);
    
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Error al parsear la respuesta como JSON:', e);
      responseData = { message: responseText || `Error en el servidor: ${response.status}` };
    }

    if (!response.ok) {
      // Si la respuesta no es exitosa, lanzar un error con el detalle
      console.error('Error en la respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      
      // Manejar específicamente el error 422
      if (response.status === 422) {
        console.error('Error de validación (422):', responseData);
        
        // Extraer detalles de la validación si existen
        let validationErrors = '';
        if (responseData.errors) {
          for (const field in responseData.errors) {
            validationErrors += `${field}: ${responseData.errors[field].join(', ')}\n`;
          }
        }
        
        throw new Error(`Error de validación: ${validationErrors || responseData.message || 'Datos inválidos'}`);
      }
      
      const errorMessage = responseData.message || 
                          responseData.error || 
                          `Error en el servidor: ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidForm) {
      setError('Por favor complete todos los campos correctamente');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verificar si tenemos un token, de lo contrario intentar obtener uno
      let token = localStorage.getItem('token');
      
      if (!token) {
        try {
          // Intenta obtener un token público para registro
          const tokenResponse = await fetch('https://contabl.net/kleep/api/public-token', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            token = tokenData.token;
            // Guardar el token temporalmente
            if (token) {
              localStorage.setItem('token', token);
            }
          }
        } catch (tokenError) {
          console.error('Error al obtener token público:', tokenError);
          // Continuar sin token, el backend decidirá si lo permite
        }
      }

      // Limpiar datos
      const cleanEmail = email.trim();
      const cleanName = name.trim();
      const cleanPhone = phone.trim().replace(/[^\d+\s]/g, '');
      const cleanCountry = country.trim();
      const cleanCity = city.trim();

      try {
        // INTENTO 1: Enviar datos como FormData (para archivos)
        const formData = new FormData();
        formData.append('email', cleanEmail);
        formData.append('name', cleanName);
        formData.append('phone', cleanPhone);
        formData.append('country', cleanCountry);
        formData.append('city', cleanCity);
        
        if (profilePicture) {
          formData.append('profile_picture', profilePicture);
        }

        // Llamar a la API de creación de usuario
        const userResponse = await createUserProfile(formData);
        
        handleSuccessfulRegistration(userResponse, {
          name: cleanName,
          phone: cleanPhone,
          country: cleanCountry,
          city: cleanCity,
          has_profile_picture: !!profilePicture
        });
      } catch (formDataError: any) {
        console.error('Error al enviar con FormData:', formDataError);
        
        // Si el error es 422, intentar con JSON
        if (formDataError.message && formDataError.message.includes('422')) {
          console.log('Intentando con formato JSON como alternativa...');
          
          // INTENTO 2: Enviar datos como JSON (sin archivos)
          const jsonData = {
            email: cleanEmail,
            name: cleanName,
            phone: cleanPhone,
            country: cleanCountry,
            city: cleanCity
          };
          
          // Configurar headers
          const headers = new Headers();
          headers.append('Content-Type', 'application/json');
          
          if (token) {
            headers.append('Authorization', `Bearer ${token}`);
          }
          
          console.log('Enviando datos JSON:', jsonData);
          
          const jsonResponse = await fetch(API_USER_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(jsonData),
          });
          
          if (!jsonResponse.ok) {
            const jsonResponseText = await jsonResponse.text();
            console.error('Error en respuesta JSON:', {
              status: jsonResponse.status,
              body: jsonResponseText
            });
            throw new Error(`Error al crear usuario: ${jsonResponse.status}`);
          }
          
          const jsonResponseData = await jsonResponse.json();
          
          // Manejar respuesta exitosa
          handleSuccessfulRegistration(jsonResponseData, {
            name: cleanName,
            phone: cleanPhone,
            country: cleanCountry,
            city: cleanCity,
            has_profile_picture: false // No se pudo enviar foto con JSON
          });
        } else {
          // Si no es un error 422 o ya intentamos con JSON, propagar el error
          throw formDataError;
        }
      }
    } catch (error: any) {
      console.error('Error completo:', error);
      
      // Intentar mostrar más detalles del error
      let errorMessage = 'Error al crear el usuario';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Si hay una respuesta del servidor con detalles adicionales
      if (error.response) {
        try {
          const errorData = error.response;
          console.error('Detalles del error del servidor:', errorData);
          
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (parseError) {
          console.error('Error al analizar la respuesta del servidor:', parseError);
        }
      }
      
      setError(`Error: ${errorMessage}`);
      toast.error(errorMessage || 'Error al crear el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el registro exitoso
  const handleSuccessfulRegistration = (response: any, userInfo: any) => {
    // Si la respuesta contiene un token, guardarlo
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    // Mostrar notificación de éxito
    toast.success('Usuario creado correctamente');

    // Guardar la información del usuario en localStorage
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', response.id || response.user_id);
    localStorage.setItem('isAuthenticated', 'true');
    
    // Agregar información adicional del usuario
    localStorage.setItem('userInfo', JSON.stringify(userInfo));

    // Redirigir al usuario al perfil
    navigate('/profile');
  };

  return (
    <div className="relative w-full h-screen flex justify-center items-center overflow-hidden bg-[#0c0c0c]">
      <div id="particles-js" ref={particlesContainer} className="absolute inset-0 z-0">
        {particlesLoaded && <ParticlesBackground containerRef={particlesContainer} />}
      </div>

      <div className="relative z-10 bg-[rgba(25,25,25,0.85)] backdrop-blur-md rounded-xl w-[90%] max-w-[500px] p-8 md:p-10 shadow-lg border border-[rgba(51,51,51,0.2)] overflow-hidden animate-fadeIn">
        <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[#8b5cf6] to-[#c084fc]"></div>

        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-2">
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#c084fc] bg-clip-text text-transparent">K</span>
          </h1>
          <h2 className="text-white mt-4 text-xl sm:text-2xl font-bold">
            Crear una cuenta
          </h2>
        </div>

        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              className="w-full py-3 px-4 bg-[rgba(28,28,28,0.7)] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78bfa] border border-[rgba(75,75,75,0.5)]"
              id="name"
              placeholder="Nombre completo"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoComplete="name"
            />
          </div>
          
          <div className="mb-4">
            <input
              className="w-full py-3 px-4 bg-[rgba(28,28,28,0.7)] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78bfa] border border-[rgba(75,75,75,0.5)]"
              id="email"
              placeholder="Correo electrónico"
              type="email"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          
          <div className="mb-4">
            <input
              className="w-full py-3 px-4 bg-[rgba(28,28,28,0.7)] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78bfa] border border-[rgba(75,75,75,0.5)]"
              id="phone"
              placeholder="Teléfono"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              autoComplete="tel"
            />
          </div>
          
          <div className="mb-4">
            <input
              className="w-full py-3 px-4 bg-[rgba(28,28,28,0.7)] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78bfa] border border-[rgba(75,75,75,0.5)]"
              id="country"
              placeholder="País"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={isLoading}
              autoComplete="country"
            />
          </div>
          
          <div className="mb-4">
            <input
              className="w-full py-3 px-4 bg-[rgba(28,28,28,0.7)] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78bfa] border border-[rgba(75,75,75,0.5)]"
              id="city"
              placeholder="Ciudad"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={isLoading}
              autoComplete="address-level2"
            />
          </div>
          
          <div className="mb-5">
            <label className="block text-white text-sm mb-2">Foto de perfil (opcional)</label>
            <div className="flex items-center gap-4">
              {previewUrl && (
                <div className="h-16 w-16 rounded-full overflow-hidden bg-[rgba(40,40,40,0.5)]">
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
              <label className="cursor-pointer bg-[rgba(40,40,40,0.5)] hover:bg-[rgba(60,60,60,0.5)] text-white px-4 py-2 rounded-lg transition-colors">
                {profilePicture ? 'Cambiar foto' : 'Subir foto'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  disabled={isLoading}
                />
              </label>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm mt-1 mb-4">{error}</p>}
          
          <button
            className={`w-full py-4 bg-gradient-to-r from-[#8b5cf6] to-[#c084fc] text-white font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:from-[#7c3aed] hover:to-[#a855f7] ${!isValidForm || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="submit"
            disabled={!isValidForm || isLoading}
          >
            {isLoading ? 'Cargando...' : 'Continuar'}
          </button>
        </form>

        <div className="create-account">
          <hr className="border-t border-[rgba(75,75,75,0.3)] my-6" />
          <div className="flex items-center justify-center">
            <p className="text-gray-300 text-center">
              ¿Ya tienes una cuenta?{" "}
              <Link className="text-[#a78bfa] hover:text-[#c4b5fd] hover:underline transition-colors" to="/signin">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para el fondo de partículas
function ParticlesBackground({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  useEffect(() => {
    const interval = setInterval(() => {
      if ((window as any).particlesJS && containerRef.current) {
        (window as any).particlesJS("particles-js", {
          particles: {
            number: {
              value: 100,
              density: { enable: true, value_area: 800 },
            },
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
        clearInterval(interval); // solo una vez
      }
    }, 100); // chequea cada 100ms

    return () => clearInterval(interval);
  }, [containerRef]);

  return null;
}

export default SignUp;
