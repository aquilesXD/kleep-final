const ProfilePaymentMethods = () => {
  return (
    <div className="p-6">
      <h1 className="text-xl font-medium mb-6">Formas de pago</h1>

      <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded p-10 flex justify-center items-center mb-4">
        <p className="text-gray-500 text-lg">No se han encontrado formas de pago</p>
      </div>

      <div className="flex justify-end">
        <button className="bg-[#8c52ff] hover:bg-[#7a3ef7] text-white rounded px-6 py-2.5 text-base font-medium">
          Añadir método de pago
        </button>
      </div>
    </div>
  );
};

export default ProfilePaymentMethods;
