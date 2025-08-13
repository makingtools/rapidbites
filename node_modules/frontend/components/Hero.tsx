import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="relative bg-dark text-white h-[60vh] min-h-[400px] flex items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1920&auto=format&fit=crop"
          alt="Variedad de comida rápida colombiana"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      <div className="relative z-10 p-4">
        <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white drop-shadow-lg">
          Sabor que va contigo
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-secondary font-semibold">
          Tu comida favorita, más rápida y deliciosa que nunca.
        </p>
        <a
          href="#menu"
          className="mt-8 inline-block bg-primary text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-red-500 transform hover:scale-105 transition-all"
        >
          Ver Menú
        </a>
      </div>
    </section>
  );
};