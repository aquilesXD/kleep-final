"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle', 'processing', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const particlesContainer = useRef<HTMLDivElement>(null);
  const [particlesScriptLoaded, setParticlesScriptLoaded] = useState(false);
  
  // Usar useRef para guardar el ID del timeout
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (isAuthenticated === "true") {
      navigate("/profile-saldo");
    }

    if (typeof window !== "undefined" && !(window as any).particlesJS) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
      script.async = true;
      script.onload = () => {
        setParticlesScriptLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setParticlesScriptLoaded(true);
    }

    // Limpiar timeout al desmontar el componente
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (particlesScriptLoaded && typeof (window as any).particlesJS !== "undefined") {
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
        } catch (error) {}
      }, 100);
    }
  }, [particlesScriptLoaded]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsValidEmail(validateEmail(value));
    setErrorMessage(null);
    // Restablecer el estado si el usuario está escribiendo de nuevo
    if (status !== "idle") {
      setStatus("idle");
    }
  };

  const handleSendCode = async () => {
    if (!isValidEmail) {
      setErrorMessage("Por favor ingresa un correo electrónico válido");
      return;
    }

    setStatus("processing");
    setErrorMessage(null);

    try {
      // Mostrar mensaje de espera
      console.log("Procesando solicitud para:", email);
      
      // Limpiar cualquier timeout existente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Establecer un nuevo timeout de 3 segundos
      timeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch("https://contabl.net/kleep/api/auth/send-code", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status}`);
          }

          const data = await response.json();
          console.log("Código enviado exitosamente:", data);
          
          // Guardar datos importantes
          localStorage.setItem("userEmail", email);
          localStorage.setItem("apiResponse", JSON.stringify(data));
          
          // Actualizar estado a éxito
          setStatus("success");
          
          // Redirigir después de un breve retraso
          timeoutRef.current = setTimeout(() => {
            navigate("/verify-code");
          }, 1000);
          
        } catch (error: any) {
          console.error("Error completo:", error);
          setStatus("error");
          setErrorMessage(`Error al enviar el código: ${error.message}`);
        }
      }, 3000);
      
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(`Error al procesar la solicitud: ${error.message}`);
    }
  };

  const isLoading = status === "processing";
  const isSuccess = status === "success";

  return (
    <div className="relative w-full h-screen flex justify-center items-center overflow-hidden bg-[#0c0c0c]">
      <div id="particles-js" ref={particlesContainer} className="absolute inset-0 z-0"></div>

      <div className="relative z-10 bg-[rgba(25,25,25,0.85)] backdrop-blur-md rounded-xl w-[90%] max-w-[450px] p-8 md:p-10 shadow-lg border border-[rgba(51,51,51,0.2)] overflow-hidden animate-fadeIn">
        <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[#8b5cf6] to-[#c084fc]"></div>

        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-2">
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#c084fc] bg-clip-text text-transparent">K</span>
          </h1>
          <h2 className="text-white mt-4 text-xl sm:text-2xl font-bold">Iniciar sesión</h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCode();
          }}
        >
          <div className="mb-5 relative">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={20} />
              </span>
              <input
                type="email"
                name="email"
                className="w-full py-4 pl-10 pr-4 bg-[rgba(28,28,28,0.7)] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78bfa] border border-[rgba(75,75,75,0.5)]"
                placeholder="Correo electrónico"
                value={email}
                onChange={handleEmailChange}
                required
                autoComplete="email"
                disabled={isLoading || isSuccess}
              />
            </div>
            {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
            {isSuccess && <p className="text-green-500 text-sm mt-2">Código enviado correctamente</p>}
          </div>

          <button
            type="submit"
            className={`w-full py-4 bg-gradient-to-r from-[#8b5cf6] to-[#c084fc] text-white font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:from-[#7c3aed] hover:to-[#a855f7] ${
              (isLoading || isSuccess) ? "opacity-75 cursor-not-allowed" : ""
            }`}
            disabled={isLoading || isSuccess}
          >
            {isLoading ? "Cargando..." : 
             isSuccess ? "Código enviado ✓" : "Continuar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-300">
            ¿No tienes una cuenta?{" "}
            <Link to="/signup" className="text-[#a78bfa] hover:text-[#c4b5fd] hover:underline transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}