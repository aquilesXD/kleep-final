import { useState } from 'react';

const ProfileSecurity = () => {
  const [authMethod, setAuthMethod] = useState('authenticator');

  return (
    <div className="p-6">
      <h1 className="text-xl font-medium mb-2">Seguridad</h1>
      <p className="text-gray-200 mb-6">Proteja su cuenta solicitando un código de verificación al iniciar sesión.</p>

      <div className="flex flex-col gap-4">
        <div className={`bg-[#0c0c0c] border ${authMethod === 'authenticator' ? 'border-[#8c52ff]' : 'border-[#1c1c1c]'} p-4 rounded-md flex items-start gap-4`}>
          <div className="mt-1">
            <div className={`w-4 h-4 rounded-full border ${authMethod === 'authenticator' ? 'bg-[#8c52ff] border-[#8c52ff]' : 'bg-transparent border-gray-500'} flex items-center justify-center`}>
              {authMethod === 'authenticator' && (
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium">Aplicación Authenticator (recomendada)</h3>
            <p className="text-gray-400 text-sm">Recibir un código a través de una aplicación de autenticación.</p>
          </div>
        </div>

        <div className={`bg-[#0c0c0c] border ${authMethod === 'sms' ? 'border-[#8c52ff]' : 'border-[#1c1c1c]'} p-4 rounded-md flex items-start gap-4`}
          onClick={() => setAuthMethod('sms')}>
          <div className="mt-1">
            <div className={`w-4 h-4 rounded-full border ${authMethod === 'sms' ? 'bg-[#8c52ff] border-[#8c52ff]' : 'bg-transparent border-gray-500'} flex items-center justify-center`}>
              {authMethod === 'sms' && (
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium">Mensaje de texto</h3>
            <p className="text-gray-400 text-sm">Recibirá un código por SMS</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button className="bg-[#8c52ff] hover:bg-[#7a3ef7] text-white rounded px-6 py-2.5 text-base font-medium">
          Activar autenticación de 2 factores
        </button>
      </div>
    </div>
  );
};

export default ProfileSecurity;
