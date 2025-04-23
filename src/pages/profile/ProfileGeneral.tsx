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
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  
  // Determinar si el formulario es válido
  const isFormValid = () => {
    return (
      profile.email.trim() !== '' &&
      /\S+@\S+\.\S+/.test(profile.email) &&
      profile.name.trim() !== '' &&
      profile.name.length >= 2 &&
      (!profile.username || profile.username.length >= 3) &&
      (profile.age === null || profile.age === undefined || (profile.age >= 0 && profile.age <= 120)) &&
      (!newProfilePicture || (newProfilePicture.size <= 2 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/gif'].includes(newProfilePicture.type)))
    );
  };

  // Función para obtener el perfil del usuario
  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const response = await axios.get(`${API_ENDPOINT}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const userData = response.data.user;
        setProfile({
          email: userData.email,
          name: userData.name,
          username: userData.username,
          biography: userData.biography,
          age: userData.age,
          country: userData.country,
          city: userData.city || '',
          phone: userData.phone || '',
          profile_picture: userData.profile_image,
        });
      } else {
        setError('No se pudieron cargar los datos del perfil.');
      }
    } catch (error: any) {
      setError('Error al obtener el perfil del usuario.');
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
  
  // Función para guardar el perfil actualizado
  const handleSaveProfile = async () => {
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

      const updatedData = {
        name: profile.name,
        phone: profile.phone,
        country: profile.country,
        city: profile.city,
        profile_picture: newProfilePicture ? URL.createObjectURL(newProfilePicture) : profile.profile_picture,
      };

      const response = await axios.put(`${API_ENDPOINT}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        setSuccess('¡Perfil actualizado exitosamente!');
        setTimeout(() => setSuccess(''), 3000); // Limpia el mensaje después de 3 segundos
        fetchUserProfile(); // Recargar el perfil actualizado
      } else {
        setError('No se pudo actualizar el perfil.');
      }
    } catch (error: any) {
      setError('Error al actualizar el perfil.');
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

  // Cargar el perfil al montar el componente
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Renderizar la imagen de perfil optimizada
  const renderProfileImage = () => {
    if (newProfilePicture) {
      return (
        <img 
          src={URL.createObjectURL(newProfilePicture)} 
          alt="Foto de perfil" 
          className="w-full h-full object-cover"
        />
      );
    } else if (profile.profile_picture) {
      return (
        <img 
          src={profile.profile_picture}
          alt="Foto de perfil" 
          className="w-full h-full object-cover"
          key={profile.profile_picture}
        />
      );
    } else {
      return (
        <div className="text-3xl text-gray-500">
          {profile.name && profile.name.trim() !== '' ? profile.name.charAt(0).toUpperCase() : '?'}
        </div>
      );
    }
  };
  
  return (
    <div className="p-3 sm:p-4 md:p-6">
      <h2 className="text-lg sm:text-xl font-medium mb-4">Perfil</h2>

      {/* Tabs para alternar entre vistas */}
      <div className="tabs flex mb-6">
        <button
          onClick={() => setActiveTab('view')}
          className={`px-4 py-2 rounded-t-md ${
            activeTab === 'view' ? 'bg-[#8e4dff] text-white' : 'bg-[#1c1c1c] text-white-400'
          }`}
        >
        Información Básica
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 rounded-t-md ml-2 ${
            activeTab === 'edit' ? 'bg-[#8e4dff] text-white' : 'bg-[#1c1c1c] text-gray-400'
          }`}
        >
          Actualizar Datos
        </button>
      </div>

      {/* Contenido de las tabs */}
      {activeTab === 'view' && (
        <div>
          <h3 className="text-lg font-medium mb-4">Información Básica</h3>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Nombre</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.name || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Teléfono</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.email || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Teléfono</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.phone || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">País</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.country || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Ciudad</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.city || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Biografía</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.biography || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Edad</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.age !== null && profile.age !== undefined ? profile.age : 'No especificado'}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'edit' && (
        <div>
          <h3 className="text-lg font-medium mb-4">Actualizar Datos</h3>
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

          {/* Sección de formulario ajustada para eliminar email, age y biography */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Nombre <span className="text-red-500">*</span></label>
            <input
              className={`w-full p-2.5 bg-[#101010] border ${errors.name ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
              placeholder="Nombre completo"
              type="text"
              value={profile.name}
              onChange={(e) => updateProfile('name', e.target.value)}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Teléfono</label>
            <input
              className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white focus:outline-none focus:border-[#272727]"
              placeholder="Número de teléfono"
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => updateProfile('phone', e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">País</label>
            <input
              className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white focus:outline-none focus:border-[#272727]"
              placeholder="País"
              type="text"
              value={profile.country || ''}
              onChange={(e) => updateProfile('country', e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Ciudad</label>
            <input
              className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white focus:outline-none focus:border-[#272727]"
              placeholder="Ciudad"
              type="text"
              value={profile.city || ''}
              onChange={(e) => updateProfile('city', e.target.value)}
            />
          </div>

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

          <div className="pb-4">
            <button 
              className={`w-full py-3.5 ${
                isFormValid() 
                  ? 'bg-[#8e4dff] hover:bg-[#7e3dff] cursor-pointer' 
                  : 'bg-[#4d4d4d] cursor-not-allowed'
              } text-white rounded-md font-medium transition-colors flex justify-center items-center`}
              onClick={handleSaveProfile}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileGeneral;