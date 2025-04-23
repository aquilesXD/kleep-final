import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// Definir interfaces para el tipado estricto
interface UserProfile {
  email: string;
  name: string;
  username?: string;
  biography?: string;
  age?: number | null;
  country?: string;
  city?: string;
  phone?: string;
  profile_picture?: string;
}

interface ProfileErrors {
  email?: string;
  name?: string;
  username?: string;
  age?: string;
  profilePicture?: string;
}

// API endpoint constante
const API_ENDPOINT = 'https://contabl.net/kleep/api/user';

const ProfileGeneral: React.FC = () => {
  // Estados principales utilizando el tipado
  const [profile, setProfile] = useState<UserProfile>({
    email: '',
    name: '',
    username: '',
    biography: '',
    age: null,
    country: '',
    city: '',
    phone: '',
    profile_picture: undefined
  });
  
  // Estado para la nueva imagen de perfil
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);
  
  // Referencia para el input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados de UI
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  
  // Función para obtener el perfil del usuario
  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    
    // Obtener email desde localStorage
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setProfile(prev => ({ ...prev, email: storedEmail }));
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      // Preparar la solicitud con Axios
      const config = {
        method: 'GET',
        url: API_ENDPOINT,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        withCredentials: false // Importante para CORS
      };
      
      console.log('Realizando solicitud a:', API_ENDPOINT);
      console.log('Con configuración:', config);
      
      // Ejecutar la solicitud
      const response = await axios(config);
      
      console.log('Respuesta del servidor al obtener perfil:', response.data);
      
      // Extraer datos del usuario de la respuesta
      const userData = extractUserData(response.data);
      
      if (userData) {
        console.log('Datos de usuario obtenidos:', userData);
        // Actualizar el estado de forma inmutable
        setProfile(userData);
        setIsCreating(false);
      } else {
        console.log('No se encontraron datos de usuario válidos');
        
        // Si no hay datos, usar el email almacenado
        setProfile(prev => ({ 
          ...prev, 
          email: storedEmail || '' 
        }));
        setIsCreating(true);
      }
    } catch (error: any) {
      console.error('Error al obtener el perfil:', error);
      
      // Manejar errores de CORS y red
      if (error.message && error.message.includes('Network Error')) {
        console.log('Error de red detectado');
        setError('Error de conexión con el servidor. Por favor, verifica tu conexión a internet o contacta al administrador.');
      } else if (axios.isAxiosError(error)) {
        // Si es 404, necesitamos crear un perfil
        if (error.response?.status === 404) {
          setProfile(prev => ({ 
            ...prev, 
            email: storedEmail || '' 
          }));
          setIsCreating(true);
        } else {
          setError(`Error: ${error.response?.statusText || error.message}`);
          console.log('Datos del error:', error.response?.data);
        }
      } else {
        setError('No se pudo cargar el perfil. Por favor, intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Validar campos
  const validateFields = (): boolean => {
    const newErrors: ProfileErrors = {};
    
    // Validar email
    if (!profile.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Validar nombre
    if (!profile.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (profile.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    // Validar nombre de usuario
    if (profile.username && profile.username.trim() && profile.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    
    // Validar edad
    if (profile.age !== null && profile.age !== undefined && (profile.age < 0 || profile.age > 120)) {
      newErrors.age = 'La edad debe estar entre 0 y 120 años';
    }
    
    // Validar imagen de perfil
    if (newProfilePicture) {
      // Validar tamaño (máximo 2MB)
      if (newProfilePicture.size > 2 * 1024 * 1024) {
        newErrors.profilePicture = 'La imagen no debe superar los 2MB';
      }
      
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(newProfilePicture.type)) {
        newErrors.profilePicture = 'Formato no válido. Use JPG, PNG o GIF';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Función para actualizar de forma inmutable campos específicos del perfil
  const updateProfile = (field: keyof UserProfile, value: any) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      [field]: value
    }));
  };
  
  // Manejadores de cambios en los inputs
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile('email', e.target.value);
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile('name', e.target.value);
  };
  
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile('username', e.target.value);
  };
  
  const handleBiographyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateProfile('biography', e.target.value);
  };
  
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? null : Number(e.target.value);
    updateProfile('age', value);
  };
  
  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile('country', e.target.value);
  };
  
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile('city', e.target.value);
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile('phone', e.target.value);
  };
  
  // Función para seleccionar archivo de imagen
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewProfilePicture(e.target.files[0]);
    }
  };
  
  // Función para abrir el selector de archivos
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Función para guardar el perfil
  const handleSaveProfile = async () => {
    // Validar campos antes de enviar
    if (!validateFields()) {
      setError('Por favor, corrige los errores en el formulario');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      // Preparar el FormData
      const formData = new FormData();
      
      // Añadir todos los campos del perfil
      formData.append('email', profile.email);
      formData.append('name', profile.name);
      
      // Añadir campos opcionales solo si tienen valor
      if (profile.username !== undefined) formData.append('username', profile.username || '');
      if (profile.biography !== undefined) formData.append('biography', profile.biography || '');
      if (profile.age !== null && profile.age !== undefined) formData.append('age', profile.age.toString());
      if (profile.country !== undefined) formData.append('country', profile.country || '');
      if (profile.city !== undefined) formData.append('city', profile.city || '');
      if (profile.phone !== undefined) formData.append('phone', profile.phone || '');
      
      // Añadir la imagen solo si hay una nueva
      if (newProfilePicture) {
        formData.append('profile_picture', newProfilePicture);
      }

      // Para debug: mostrar qué se está enviando
      console.log('Enviando datos:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      
      // Log de la operación que se realizará
      console.log(`${isCreating ? 'Creando' : 'Actualizando'} perfil en: ${API_ENDPOINT}`);
      
      // Mostrar mensaje de éxito inmediato (optimistic UI)
      setSuccess(isCreating ? '¡Creando perfil...' : '¡Guardando cambios...');
      
      // Configuración para la solicitud
      const config = {
        method: isCreating ? 'POST' : 'PUT',
        url: API_ENDPOINT,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
          // No establecer Content-Type, Axios lo establecerá automáticamente para FormData
        },
        data: formData,
        withCredentials: false // Importante para CORS
      };
      
      console.log('Configuración de la solicitud:', config);
      
      // Realizar la solicitud
      const response = await axios(config);
      
      console.log('Respuesta completa del servidor:', response);
      console.log('Datos de respuesta:', response.data);
      
      // Actualizar mensaje de éxito
      setSuccess(isCreating ? '¡Perfil creado exitosamente!' : '¡Perfil actualizado exitosamente!');
      
      // Si estábamos creando, cambiar a modo actualización
      if (isCreating) setIsCreating(false);
      
      // Intentar procesar la respuesta
      const userData = extractUserData(response.data);
      
      if (userData) {
        console.log('Perfil actualizado con datos recibidos:', userData);
        
        // Actualizar el perfil con los datos extraídos
        setProfile(prevProfile => ({
          ...prevProfile,
          ...userData,
          // Si la imagen de perfil cambió, aplicar timestamp para forzar recarga
          profile_picture: userData.profile_picture 
            ? addTimestampToUrl(userData.profile_picture) 
            : prevProfile.profile_picture
        }));
      } else {
        // Si no pudimos extraer datos pero la operación fue exitosa,
        // recargamos todo el perfil del servidor después de un breve retraso
        console.log('No se pudieron extraer datos de la respuesta. Recargando perfil después de 2 segundos...');
        
        setTimeout(async () => {
          try {
            await fetchUserProfile();
            console.log('Perfil recargado después de guardar');
          } catch (error) {
            console.error('Error al recargar el perfil:', error);
          }
        }, 2000);
      }
      
      // Limpiar la nueva imagen
      setNewProfilePicture(null);
      
      // Limpiar mensaje de éxito después de un tiempo
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (error: any) {
      console.error('Error completo:', error);
      
      // Manejar errores de red
      if (error.message && error.message.includes('Network Error')) {
        setError('Error de conexión con el servidor. Por favor, verifica tu conexión a internet o contacta al administrador.');
        console.log('Detalles del error de red:', error);
      } else {
        handleApiError(error);
      }
      
      // En caso de error, intentar recargar los datos originales
      try {
        await fetchUserProfile();
      } catch (fetchError) {
        console.error('Error al recargar el perfil después de un error:', fetchError);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Añadir timestamp a URL para evitar caché
  const addTimestampToUrl = (url: string): string => {
    if (!url) return url;
    const timestamp = new Date().getTime();
    return url.includes('?') 
      ? `${url}&t=${timestamp}` 
      : `${url}?t=${timestamp}`;
  };
  
  // Función para extraer datos de usuario
  const extractUserData = (responseData: any): UserProfile | null => {
    if (!responseData) return null;
    
    // Para propósitos de depuración, mostrar la estructura completa de la respuesta
    console.log('Estructura completa de la respuesta:', responseData);
    
    // Caso 1: Respuesta al obtener perfil - estructura con "success" y "user"
    if (responseData.success === true && responseData.user) {
      console.log('Detectada respuesta de tipo "Obtener perfil"');
      const userData = responseData.user;
      
      // Construir objeto de perfil
      const userProfile: UserProfile = {
        email: userData.email || '',
        name: userData.name || '',
      };
      
      // Manejar campos opcionales
      if (userData.username !== undefined) userProfile.username = userData.username;
      if (userData.biography !== undefined) userProfile.biography = userData.biography;
      if (userData.age !== undefined) userProfile.age = userData.age;
      if (userData.country !== undefined) userProfile.country = userData.country;
      // Si el API devuelve profile_image en lugar de profile_picture
      if (userData.profile_image) userProfile.profile_picture = userData.profile_image;
      if (userData.profile_picture) userProfile.profile_picture = userData.profile_picture;
      
      return userProfile;
    }
    
    // Caso 2 y 3: Respuesta de creación/actualización - estructura directa con campos
    if (typeof responseData === 'object' && (responseData.name !== undefined || responseData.phone !== undefined)) {
      console.log('Detectada respuesta de tipo "Crear/Actualizar perfil"');
      
      // Para creación/actualización necesitamos combinar con datos existentes
      const userProfile: UserProfile = {
        ...profile, // Mantener datos existentes
        // Actualizar con los nuevos datos
        name: responseData.name !== undefined ? responseData.name : profile.name,
      };
      
      // Campos específicos
      if (responseData.email !== undefined) userProfile.email = responseData.email;
      if (responseData.phone !== undefined) userProfile.phone = responseData.phone;
      if (responseData.country !== undefined) userProfile.country = responseData.country;
      if (responseData.city !== undefined) userProfile.city = responseData.city;
      if (responseData.profile_picture !== undefined) userProfile.profile_picture = responseData.profile_picture;
      if (responseData.username !== undefined) userProfile.username = responseData.username;
      if (responseData.biography !== undefined) userProfile.biography = responseData.biography;
      if (responseData.age !== undefined) userProfile.age = responseData.age;
      
      return userProfile;
    }
    
    // Verificar otras estructuras posibles
    if (responseData.data) {
      return extractUserData(responseData.data);
    } else if (responseData.userData) {
      return extractUserData(responseData.userData);
    }
    
    console.log('No se pudo determinar el formato de la respuesta:', responseData);
    return null;
  };
  
  // Función para manejar errores de API
  const handleApiError = (error: any) => {
    console.error('Error al guardar el perfil:', error);
    
    if (axios.isAxiosError(error)) {
      // Mostrar detalles completos del error para debug
      console.log('Detalles completos del error:', error.response?.data);
      
      // Extraer el mensaje de error de diferentes posibles ubicaciones
      let errorMessage = 'Error desconocido al comunicarse con el servidor';
      
      if (error.response?.data?.message) {
        errorMessage = `Error: ${error.response.data.message}`;
      } else if (error.response?.data?.error) {
        errorMessage = `Error: ${error.response.data.error}`;
      } else if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
        // Manejar errores de validación que vienen como objeto
        const errorFields = Object.keys(error.response.data.errors);
        if (errorFields.length > 0) {
          errorMessage = `Error en campo(s): ${errorFields.join(', ')}`;
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } else {
      setError('No se pudo guardar el perfil. Por favor, intenta nuevamente.');
    }
  };
  
  // Cargar el perfil al montar el componente
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);
  
  // Comprobar si el formulario es válido (para habilitar/deshabilitar el botón)
  const isFormValid = profile.email.trim() !== '' && profile.name.trim() !== '';
  
  // Renderizar la imagen de perfil optimizada
  const renderProfileImage = () => {
    if (newProfilePicture) {
      // Si hay una nueva imagen seleccionada, mostrarla desde el objeto File
      return (
        <img 
          src={URL.createObjectURL(newProfilePicture)} 
          alt="Foto de perfil" 
          className="w-full h-full object-cover"
        />
      );
    } else if (profile.profile_picture) {
      // Si hay una imagen guardada en el perfil, mostrarla
      return (
        <img 
          src={profile.profile_picture}
          alt="Foto de perfil" 
          className="w-full h-full object-cover"
          // Forzar recarga de la imagen si cambia la URL
          key={profile.profile_picture}
        />
      );
    } else {
      // Si no hay imagen, mostrar la inicial del nombre
      return (
        <div className="text-3xl text-gray-500">
          {profile.name && profile.name.trim() !== '' ? profile.name.charAt(0).toUpperCase() : '?'}
        </div>
      );
    }
  };
  
  return (
    <div className="p-3 sm:p-4 md:p-6">
      <h2 className="text-lg sm:text-xl font-medium mb-4">
        {isCreating ? 'Crear perfil' : 'Información básica'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded-md text-green-200 text-sm">
          {success}
        </div>
      )}

      {/* Sección de foto de perfil */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-3">Foto de perfil</label>
        <div className="flex items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#1c1c1c] flex items-center justify-center">
              {renderProfileImage()}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
            />
          </div>
          <div className="ml-4">
            <button
              type="button"
              onClick={triggerFileInput}
              className="px-3 py-2 bg-[#1c1c1c] text-white text-sm rounded hover:bg-[#272727]"
            >
              Cambiar foto
            </button>
            <p className="text-xs text-gray-500 mt-1">Formatos: JPG, PNG o GIF. Máx. 2MB</p>
            {errors.profilePicture && (
              <p className="text-red-500 text-xs mt-1">{errors.profilePicture}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1.5">Email <span className="text-red-500">*</span></label>
        <input
          className={`w-full p-2.5 bg-[#101010] border ${errors.email ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
          placeholder="Correo electrónico"
          type="email"
          value={profile.email}
          onChange={handleEmailChange}
          disabled={!isCreating} // Solo permitir editar email al crear perfil
          required
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1.5">Nombre <span className="text-red-500">*</span></label>
        <input
          className={`w-full p-2.5 bg-[#101010] border ${errors.name ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
          placeholder="Nombre"
          type="text"
          value={profile.name}
          onChange={handleNameChange}
          required
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1.5">Teléfono</label>
        <input
          className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white focus:outline-none focus:border-[#272727]"
          placeholder="Número de teléfono"
          type="tel"
          value={profile.phone || ''}
          onChange={handlePhoneChange}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1.5">Nombre de usuario</label>
        <input
          className={`w-full p-2.5 bg-[#101010] border ${errors.username ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
          placeholder="Nombre de usuario"
          type="text"
          value={profile.username || ''}
          onChange={handleUsernameChange}
        />
        {errors.username && (
          <p className="text-red-500 text-xs mt-1">{errors.username}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1.5">Biografía</label>
        <textarea
          className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white h-[80px] sm:h-[100px] focus:outline-none focus:border-[#272727]"
          placeholder="Sin biografía"
          value={profile.biography || ''}
          onChange={handleBiographyChange}
        ></textarea>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1.5">Edad</label>
        <input
          className={`w-full p-2.5 bg-[#101010] border ${errors.age ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
          placeholder="Edad"
          type="number"
          value={profile.age === null || profile.age === undefined ? '' : profile.age}
          onChange={handleAgeChange}
          min="0"
          max="120"
        />
        {errors.age && (
          <p className="text-red-500 text-xs mt-1">{errors.age}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1.5">País</label>
        <input
          className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white focus:outline-none focus:border-[#272727]"
          placeholder="País"
          type="text"
          value={profile.country || ''}
          onChange={handleCountryChange}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-1.5">Ciudad</label>
        <input
          className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white focus:outline-none focus:border-[#272727]"
          placeholder="Ciudad"
          type="text"
          value={profile.city || ''}
          onChange={handleCityChange}
        />
      </div>

      <div className="pb-4">
        <button 
          className={`w-full py-3.5 ${
            isFormValid 
              ? 'bg-[#8e4dff] hover:bg-[#7e3dff] cursor-pointer' 
              : 'bg-[#4d4d4d] cursor-not-allowed'
          } text-white rounded-md font-medium transition-colors flex justify-center items-center`}
          onClick={handleSaveProfile}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : isCreating ? 'Crear perfil' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
};

export default ProfileGeneral;