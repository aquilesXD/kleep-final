import React, { useState, useEffect, useRef, useMemo } from 'react'; // Import useMemo
import { Link, useNavigate } from 'react-router-dom';
import { LogoIcon } from '../../components/icons';
import '../../components/ui/Form.css';
import { toast } from 'react-hot-toast';

// Define los formatos de teléfono, prefijos y longitud máxima de *dígitos después del prefijo*.
// Para 'Otro', maxLength 15 se interpreta como la longitud *total* máxima.
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
    Otro: { prefix: '+', maxLength: 15, format: (v) => v } // maxLength 15 aquí es longitud TOTAL de caracteres
};

const API_USER_ENDPOINT = 'https://contabl.net/kleep/api/auth/register';


const SignUp: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [country, setCountry] = useState<string>(''); // Estado para el país seleccionado
    const [phone, setPhone] = useState<string>('');     // Estado para el número de teléfono (incluyendo prefijo)
    const [age, setAge] = useState<string>('');
    const [isValidForm, setIsValidForm] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [particlesScriptLoaded, setParticlesScriptLoaded] = useState(false);

    const navigate = useNavigate();
    const particlesContainer = useRef<HTMLDivElement>(null);

    // Cargar el script de partículas (mantienes tu lógica existente)
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

    // Inicializar las partículas (mantienes tu lógica existente)
    useEffect(() => {
        if (particlesScriptLoaded && typeof (window as any).particlesJS !== 'undefined') {
            setTimeout(() => {
                try {
                    (window as any).particlesJS("particles-js", { /* particles config */
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
                    // Manejar error si particlesJS falla la inicialización
                }
            }, 100);
        }
    }, [particlesScriptLoaded]);


    // Validación del formulario (mantienes tu lógica existente)
    useEffect(() => {
        // Validación básica: campos no vacíos y edad >= 18
        const isBasicValid =
             email.trim().length > 0 &&
             name.trim().length > 0 &&
             username.trim().length > 0 &&
             country.trim().length > 0 &&
             phone.trim().length > 0 && // Asegura que el campo de teléfono no esté vacío
             age.trim().length > 0 &&
             parseInt(age) >= 18;

        // Opcional: Validación más estricta de la longitud del teléfono *después* del prefijo
        const selectedCountryConfig = phoneFormats[country];
        let isPhoneLengthValid = true;
        if (selectedCountryConfig && country !== 'Otro') { // No validar longitud estricta para 'Otro'
             const prefixWithSpace = selectedCountryConfig.prefix + (selectedCountryConfig.prefix ? ' ' : '');
             const digitsOnly = phone.substring(prefixWithSpace.length).replace(/\D/g, '');
             // Verifica si la cantidad de dígitos coincide con la esperada
             if (digitsOnly.length !== selectedCountryConfig.maxLength) {
                 isPhoneLengthValid = false;
             }
        }

        setIsValidForm(isBasicValid && isPhoneLengthValid);

    }, [email, name, username, country, phone, age]);

    // Clases para los inputs (mantienes tu lógica existente)
    const getInputClassName = () => {
        return `w-full py-3 px-4 bg-[rgba(28,28,28,0.7)] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78bfa] border border-[rgba(75,75,75,0.5)]`;
    };

    // --- Manejadores de cambios actualizados ---

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

    // Maneja el cambio en el selector de país
    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCountryName = e.target.value;
        setCountry(selectedCountryName); // Actualiza el estado del país

        if (selectedCountryName) { // Si se seleccionó un país válido (no la opción por defecto)
            const formatConfig = phoneFormats[selectedCountryName] || phoneFormats['Otro'];
            const newPrefix = formatConfig.prefix;
            // Establece el campo de teléfono con el nuevo prefijo y un espacio
            setPhone(newPrefix + (newPrefix ? ' ' : ''));
        } else {
            // Si se selecciona la opción por defecto ("Selecciona un país"), limpia el campo de teléfono
            setPhone('');
        }
        setError(null); // Limpia errores relacionados
    };

    // Maneja el cambio en el campo de teléfono (permite escribir, el maxLength del input restringe)
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const selectedCountryConfig = phoneFormats[country] || phoneFormats['Otro'];
        const prefix = selectedCountryConfig.prefix;
        const prefixWithSpace = prefix + (prefix ? ' ' : '');

        // Lógica para evitar borrar el prefijo
        if (!inputValue.startsWith(prefixWithSpace)) {
            // Si el usuario intenta borrar el prefijo o escribir antes,
            // re-establece el valor forzando el prefijo y manteniendo los dígitos que haya escrito después.
            // Extraemos los dígitos que el usuario intentó escribir, ignorando cualquier cosa antes de la posición del prefijo.
            const userAttemptAfterPrefix = inputValue.substring(prefixWithSpace.length - (prefixWithSpace.length - inputValue.length > 0 ? prefixWithSpace.length - inputValue.length : 0) ).replace(/\D/g, '');
             setPhone(prefixWithSpace + userAttemptAfterPrefix);

        } else {
             // Si el prefijo se mantiene, simplemente permite escribir dígitos después
             const afterPrefix = inputValue.substring(prefixWithSpace.length);
             const digitsAfter = afterPrefix.replace(/\D/g, ''); // Solo permite dígitos después del prefijo
             setPhone(prefixWithSpace + digitsAfter);
        }
         // El maxLength del input HTML se encargará de la longitud total.
    };

    // Maneja el evento cuando el campo de teléfono pierde el foco (aplica formato)
    const handlePhoneBlur = () => {
        const selectedCountryConfig = phoneFormats[country] || phoneFormats['Otro'];
        const prefix = selectedCountryConfig.prefix;
        const maxDigits = selectedCountryConfig.maxLength;
        const formatFn = selectedCountryConfig.format;

        // 1. Asegúrate de que el valor actual comience con el prefijo esperado + espacio
        const prefixWithSpace = prefix + (prefix ? ' ' : '');
        let currentValue = phone;

        if (!currentValue.startsWith(prefixWithSpace)) {
            // Esto no debería ocurrir a menudo con el handlePhoneChange, pero es una salvaguarda.
            // Si el prefijo no está, lo añadimos y limpiamos los dígitos.
             const digitsOnly = currentValue.replace(/\D/g, '');
             currentValue = prefixWithSpace + digitsOnly;
        }

        // 2. Extrae solo los dígitos que van después del prefijo + espacio
        const digitsPart = currentValue.substring(prefixWithSpace.length).replace(/\D/g, '');

        // 3. Trunca los dígitos a la longitud máxima permitida para ese país
        const truncatedDigits = digitsPart.slice(0, maxDigits);

        // 4. Aplica la función de formato específica del país a los dígitos truncados
        const formattedDigits = formatFn(truncatedDigits);

        // 5. Combina el prefijo, el espacio y los dígitos formateados
        const finalValue = prefix + (prefix ? ' ' : '') + formattedDigits;

        // 6. Actualiza el estado con el valor formateado (quita espacios al final si el formato lo deja)
        setPhone(finalValue.trim());
    };


    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 3) value = value.slice(0, 3);

        const numericAge = parseInt(value);
        if (numericAge > 100) value = '100';

        setAge(value);
        setError(null);
    };

    // Calcula dinámicamente el maxLength total para el input de teléfono
    // Usa useMemo para recalcular solo cuando cambia el 'country'
    const totalMaxLength = useMemo(() => {
        const selectedCountryConfig = phoneFormats[country];
        if (!selectedCountryConfig) return 15; // Valor por defecto si no hay país seleccionado o es 'Otro' inicialmente

        const prefix = selectedCountryConfig.prefix;
        const maxDigits = selectedCountryConfig.maxLength;

        // Caso especial para 'Otro', donde maxLength es la longitud total
        if (country === 'Otro') {
             return 15;
        }

        // Para otros países, es la longitud del prefijo + 1 por el espacio + longitud máxima de dígitos
        return prefix.length + (prefix ? 1 : 0) + maxDigits;
    }, [country, phoneFormats]); // Depende del país seleccionado


     // Calcula dinámicamente el placeholder
     const phonePlaceholder = useMemo(() => {
        const selectedCountryConfig = phoneFormats[country];
         if (!selectedCountryConfig) return "Ej: +123 456 7890"; // Placeholder genérico si no hay país seleccionado

        const prefix = selectedCountryConfig.prefix;
        const maxDigits = selectedCountryConfig.maxLength;
        const formatFn = selectedCountryConfig.format;

        if (country === 'Otro') {
             // Para 'Otro', muestra el prefijo y una serie de dígitos ejemplo hasta el max total length
             const sampleDigitsLength = Math.max(0, 15 - prefix.length - (prefix ? 1 : 0)); // Espacio si hay prefijo
             const sampleDigits = '123456789012345'.substring(0, sampleDigitsLength);
             return prefix + (prefix ? ' ' : '') + sampleDigits;
        } else {
             // Para otros países, muestra el prefijo + espacio + formato de ejemplo de los dígitos
            const sampleDigits = '1234567890'.substring(0, maxDigits); // Usa dígitos de ejemplo según maxDigits
            const examplePhoneNumber = formatFn(sampleDigits);
            return prefix + (prefix ? ' ' : '') + examplePhoneNumber;
        }
     }, [country, phoneFormats]); // Depende del país seleccionado y phoneFormats


    // Enviar datos al servidor (mantienes tu lógica existente)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidForm) {
            // Mejorar el mensaje de error basado en la validación específica si es posible
            const selectedCountryConfig = phoneFormats[country];
            if (selectedCountryConfig && country !== 'Otro') {
                 const prefixWithSpace = selectedCountryConfig.prefix + (selectedCountryConfig.prefix ? ' ' : '');
                 const digitsOnly = phone.substring(prefixWithSpace.length).replace(/\D/g, '');
                 if (digitsOnly.length !== selectedCountryConfig.maxLength) {
                      setError(`El número de teléfono para ${country} debe tener exactamente ${selectedCountryConfig.maxLength} dígitos después del prefijo.`);
                 } else {
                     setError('Por favor complete todos los campos requeridos');
                 }
            } else {
                 setError('Por favor complete todos los campos requeridos');
            }

            if (age.trim().length > 0 && parseInt(age) < 18) {
                 setError('Debes tener al menos 18 años para registrarte');
            }

            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Prepara los datos. Asegúrate de que el teléfono enviado tenga el formato deseado si la API lo espera de una forma específica.
            // Aquí enviamos el valor actual del estado 'phone', que debería tener el prefijo y el formato aplicado por onBlur.
            const userData = {
                email: email.trim(),
                name: name.trim(),
                username: username.trim(),
                country: country.trim(),
                phone: phone.trim(), // Enviar el valor del estado phone
                age: parseInt(age.trim())
            };

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
                // Intenta obtener un mensaje de error más específico del backend si está disponible
                const backendError = responseData.message || responseData.error || `Error en el servidor: ${response.status}`;
                throw new Error(backendError);
            }

            if (responseData.success) {
                localStorage.setItem('userId', responseData.user_id.toString());
                localStorage.setItem('userEmail', responseData.user.email);
                localStorage.setItem('verification_expires_at', responseData.expires_at);

                toast.success('Usuario creado correctamente. Por favor revisa tu correo electrónico para obtener el código de verificación.');

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
                            onChange={handleCountryChange} // Usa el nuevo manejador de país
                            disabled={isLoading}
                            required
                            style={{
                                // Estilos para la flecha del select
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3csvg%3e")`,
                                backgroundPosition: `right 0.5rem center`,
                                backgroundRepeat: `no-repeat`,
                                backgroundSize: `1.5em 1.5em`,
                                paddingRight: `2.5rem`
                            }}
                        >
                            <option value="">Selecciona un país</option>
                            {/* Mapea los países del objeto phoneFormats a opciones */}
                            {Object.keys(phoneFormats).map(countryName => (
                                <option key={countryName} value={countryName}>{countryName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full mb-4">
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            // Asigna el maxLength calculado dinámicamente
                            maxLength={totalMaxLength}
                            value={phone}
                            onChange={handlePhoneChange} // Usa el nuevo manejador de teléfono
                            onBlur={handlePhoneBlur}   // Usa el manejador para aplicar formato al perder foco
                            inputMode="tel"
                            // Asigna el placeholder calculado dinámicamente
                            placeholder={phonePlaceholder}
                            className={getInputClassName()}
                            required // Marca el campo como requerido si debe serlo
                        />
                    </div>

                    <div className="w-full mb-4">
                        <input
                            type="tel" // type="tel" es semánticamente correcto para edad con inputmode="numeric"
                            name="age"
                            id="age"
                            value={age}
                            onChange={handleAgeChange}
                            inputMode="numeric" // Sugiere teclado numérico en móviles
                            maxLength={3} // Limita la edad a 3 dígitos (hasta 999)
                            placeholder="Edad"
                            className={getInputClassName()}
                            required // Marca el campo como requerido
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

// Tu componente ParticlesBackground simplificado (no necesita cambios para esto)
// function ParticlesBackground({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
//   // ... tu lógica para particles.js ...
//   return null;
// }

export default SignUp;