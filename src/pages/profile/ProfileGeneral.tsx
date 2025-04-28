import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Definir interfaces para el tipado estricto
interface UserProfile {
  email: string;
  name: string;
  username: string;
  age: number | null;
  profile_image: string;
  biography: string;
  country: string;
  phone: string;
}

interface ProfileErrors {
  email?: string;
  name?: string;
  username?: string;
  age?: string;
  profilePicture?: string;
  biography?: string;
  country?: string;
  phone?: string;
}

// API endpoint constante
const API_ENDPOINT = 'https://contabl.net/kleep/api/user';

const ProfileGeneral: React.FC = () => {
  // Estados principales utilizando el tipado
  const [profile, setProfile] = useState<UserProfile>({
    email: '',
    name: '',
    username: '',
    age: null,
    profile_image: '',
    biography: '',
    country: '',
    phone: ''
  });
  
  // Estado para la nueva imagen de perfil
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);
  
  // Estado para la previsualización de la imagen
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Referencia para el input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
      (profile.age === null || (profile.age >= 0 && profile.age <= 120)) &&
      (profile.biography.length <= 500) &&
      (!newProfilePicture || (newProfilePicture.size <= 2 * 1024 * 1024 && 
        ['image/jpeg', 'image/png', 'image/gif'].includes(newProfilePicture.type))) &&
      (!profile.phone.trim() || /^\+?[0-9\s-]{7,20}$/.test(profile.phone.trim()))
    );
  };

  // Función para obtener el perfil del usuario
  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const response = await axios.get(API_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const userData = response.data.user;
        setProfile({
          email: userData.email || '',
          name: userData.name || '',
          username: userData.username || '',
          age: userData.age !== undefined ? userData.age : null,
          profile_image: userData.profile_image || '',
          biography: userData.biography || '',
          country: userData.country || '',
          phone: userData.phone || ''
        });
      } else {
        setError('No se pudieron cargar los datos del perfil.');
      }
    } catch (error: any) {
      setError('Error al obtener el perfil del usuario.');
    } finally {
      setLoading(false);
    }
  };

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
    if (profile.age !== null && (profile.age < 0 || profile.age > 120)) {
      newErrors.age = 'La edad debe estar entre 0 y 120 años';
    }
    
    // Validar biografía
    if (profile.biography && profile.biography.length > 500) {
      newErrors.biography = 'La biografía no debe exceder los 500 caracteres';
    }
    
    // Validar imagen de perfil
    if (newProfilePicture) {
      if (newProfilePicture.size > 2 * 1024 * 1024) {
        newErrors.profilePicture = 'La imagen no debe superar los 2MB';
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(newProfilePicture.type)) {
        newErrors.profilePicture = 'Formato no válido. Use JPG, PNG o GIF';
      }
    }
    
    // Validar teléfono - Hacemos la validación más flexible
    if (profile.phone.trim() && !/^[+]?[\d\s-]{7,20}$/.test(profile.phone.trim())) {
      newErrors.phone = 'Formato de teléfono inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Función para actualizar campos del perfil
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores al editar
    if (errors[field as keyof ProfileErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ProfileErrors];
        return newErrors;
      });
    }
  };
  
  // Función para manejar el cambio de imagen de perfil
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Verificar el tipo de archivo y tamaño
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          profilePicture: 'Formato no válido. Use JPG, PNG o GIF'
        }));
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profilePicture: 'La imagen no debe superar los 2MB'
        }));
        return;
      }
      
      // Guardar el archivo para enviarlo al servidor
      setNewProfilePicture(file);
      
      // Crear URL para previsualización
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview); // Liberar URL anterior
      }
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Limpiar errores si los hubiera
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.profilePicture;
        return newErrors;
      });
    }
  };
  
  // Función para abrir el selector de archivos
  const triggerFileInput = () => {
    fileInputRef.current?.click();
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

      // Crear FormData para enviar los datos
      const formData = new FormData();
      
      // Agregar campos básicos
      formData.append('name', profile.name);
      formData.append('username', profile.username);
      formData.append('biography', profile.biography);
      formData.append('country', profile.country);
      if (profile.age !== null) {
        formData.append('age', profile.age.toString());
      }
      if (profile.phone) {
        formData.append('phone', profile.phone);
      }

      // Agregar la imagen si hay una nueva
      if (newProfilePicture) {
        formData.append('profile_image', newProfilePicture);
      }

      const response = await axios.post(
        `${API_ENDPOINT}?_method=PUT`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess('¡Perfil actualizado exitosamente!');
        
        // Actualizar el estado con la nueva imagen si se envió una
        if (newProfilePicture) {
          setProfile(prev => ({
            ...prev,
            profile_image: response.data.user.profile_image
          }));
        }
        
        // Limpiar estados
        setNewProfilePicture(null);
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }
      } else {
        setError(response.data.message || 'No se pudo actualizar el perfil');
      }
    } catch (error: any) {
      console.error('Error al actualizar el perfil:', error);
      setError(error.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Cargar el perfil al montar el componente
  useEffect(() => {
    fetchUserProfile();
    
    // Limpiar recursos al desmontar el componente
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);

  // Renderizar la imagen de perfil
  const renderProfileImage = () => {
    if (imagePreview) {
      // Mostrar previsualización si hay una nueva imagen
      return (
        <img 
          src={imagePreview}
          alt="Previsualización de foto de perfil" 
          className="w-full h-full object-cover"
        />
      );
    } else if (profile.profile_image) {
      // Mostrar imagen actual del perfil
      return (
        <img 
          src={profile.profile_image}
          alt="Foto de perfil" 
          className="w-full h-full object-cover"
        />
      );
    } else {
      // Mostrar iniciales si no hay imagen
      return (
        <div className="text-3xl text-gray-500">
          {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
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

      {/* Vista de información */}
      {activeTab === 'view' && (
        <div>
          <h3 className="text-lg font-medium mb-4">Información Básica</h3>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Correo electrónico</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.email || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Nombre</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.name || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Nombre de usuario</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.username || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Edad</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.age !== null ? profile.age : 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">País</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.country || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Teléfono</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white">
              {profile.phone || 'No especificado'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Biografía</label>
            <div className="w-full p-2.5 bg-[#101010] border border-[#1c1c1c] rounded-md text-white min-h-[80px] whitespace-pre-wrap">
              {profile.biography || 'No especificado'}
            </div>
          </div>

        </div>
      )}

      {/* Formulario de edición */}
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

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Correo electrónico</label>
            <input
              className={`w-full p-2.5 bg-[#101010] border ${errors.email ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
              placeholder="Correo electrónico"
              type="email"
              value={profile.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled
              required
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">El correo electrónico no se puede modificar</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Nombre</label>
            <input
              className={`w-full p-2.5 bg-[#101010] border ${errors.name ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
              placeholder="Nombre completo"
              type="text"
              value={profile.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Nombre de usuario</label>
            <input
              className={`w-full p-2.5 bg-[#101010] border ${errors.username ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
              placeholder="Nombre de usuario"
              type="text"
              value={profile.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Edad</label>
            <input
              className={`w-full p-2.5 bg-[#101010] border ${errors.age ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
              placeholder="Edad"
              type="number"
              value={profile.age !== null ? profile.age : ''}
              onChange={(e) => handleInputChange('age', e.target.value === '' ? null : Number(e.target.value))}
            />
            {errors.age && (
              <p className="text-red-500 text-xs mt-1">{errors.age}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">País</label>
            <select
              className={`w-full p-2.5 bg-[#101010] border ${errors.country ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
              value={profile.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              required
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
            {errors.country && (
              <p className="text-red-500 text-xs mt-1">{errors.country}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Teléfono</label>
            <input
              className={`w-full p-2.5 bg-[#101010] border ${errors.phone ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727]`}
              placeholder="Número de teléfono"
              type="number"
              value={profile.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Formato: +123456789 o 123456789</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Biografía</label>
            <textarea
              className={`w-full p-2.5 bg-[#101010] border ${errors.biography ? 'border-red-500' : 'border-[#1c1c1c]'} rounded-md text-white focus:outline-none focus:border-[#272727] min-h-[100px]`}
              placeholder="Escribe algo sobre ti..."
              value={profile.biography}
              onChange={(e) => handleInputChange('biography', e.target.value)}
              maxLength={500}
            />
            {errors.biography && (
              <p className="text-red-500 text-xs mt-1">{errors.biography}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">{profile.biography.length}/500 caracteres</p>
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