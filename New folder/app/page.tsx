'use client'

import { useState, useEffect } from 'react';
import { Brain, Lightbulb, Sparkles, Zap, Users, ArrowRight, Star, Rocket, Target, Infinity, Play, ChevronDown } from "lucide-react";
import Link from 'next/link';

// Type pour l'utilisateur
interface User {
  nom: string;
  prenom: string;
}

export default function HomePage() {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const animatedTexts = ["CRÉATIVITÉ", "INNOVATION", "INSPIRATION", "COLLABORATION"];
  const currentText = animatedTexts[currentPhase];

  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Animation pour écrire les mots lettre par lettre
  useEffect(() => {
    if (currentIndex < currentText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + currentText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      // Pause puis effacer et passer au mot suivant
      const resetTimer = setTimeout(() => {
        setDisplayedText('');
        setCurrentIndex(0);
        setCurrentPhase(prev => (prev + 1) % animatedTexts.length);
      }, 2000);
      return () => clearTimeout(resetTimer);
    }
  }, [currentIndex, currentText]);

  // Simuler la récupération des données utilisateur
  useEffect(() => {
    // Ici vous intégrerez votre logique pour récupérer les infos utilisateur
    // const fetchUser = async () => {
    //   try {
    //     const response = await fetch('your-backend-endpoint');
    //     const userData = await response.json();
    //     setUser(userData);
    //   } catch (error) {
    //     console.error('Error fetching user:', error);
    //   }
    // };
    // fetchUser();
    
    // Pour la démo, simulons un utilisateur connecté ou non
    // setUser({ nom: "Dupont", prenom: "Jean" }); // Décommentez pour tester avec un utilisateur
  }, []);

  // Fixed floating elements with consistent positioning
  const floatingElements = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.5,
    duration: 3 + (i % 3),
    size: 16 + (i % 4) * 8,
    opacity: 0.2 + (i % 3) * 0.1,
    // Use deterministic positioning based on index
    top: (i * 37 + 23) % 80 + 10, // Creates distributed positions
    left: (i * 47 + 13) % 80 + 10
  }));

  // Fixed sparkles with consistent positioning
  const sparkleElements = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    top: (i * 43 + 17) % 100,
    left: (i * 53 + 29) % 100,
    duration: 2 + (i % 3),
    delay: (i * 0.7) % 3
  }));

  // Fixed light particles with consistent positioning
  const particleElements = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    top: (i * 31 + 41) % 100,
    left: (i * 59 + 7) % 100,
    duration: 1.5 + (i % 2),
    delay: (i * 0.3) % 2
  }));

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-100">
      {/* Animation CSS pour le slide des mots */}
      <style jsx>{`
        @keyframes slideFromRight {
          0% {
            transform: translateX(100px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-left span {
          animation: slideFromRight 1s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-left span:nth-child(1) { animation-delay: 0s; }
        .animate-slide-left span:nth-child(2) { animation-delay: 0.3s; }
        .animate-slide-left span:nth-child(3) { animation-delay: 0.6s; }
        .animate-slide-left span:nth-child(4) { animation-delay: 0.9s; }
      `}</style>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Texte principal animé */}
        <div className="absolute top-1/6 left-1/2 transform -translate-x-1/2">
          <div className="text-8xl font-bold text-purple-200/20 tracking-wider text-center">
            {displayedText}
          </div>
        </div>

        {/* Only render random elements on client side */}
        {isClient && (
          <>
            {/* Bulles flottantes dynamiques */}
            {floatingElements.map((element) => (
              <div
                key={element.id}
                className="absolute rounded-full bg-gradient-to-br from-purple-200/30 to-violet-200/30 animate-bounce"
                style={{
                  width: `${element.size}px`,
                  height: `${element.size}px`,
                  top: `${element.top}%`,
                  left: `${element.left}%`,
                  animationDelay: `${element.delay}s`,
                  animationDuration: `${element.duration}s`,
                  opacity: element.opacity
                }}
              />
            ))}

            {/* Étoiles scintillantes */}
            {sparkleElements.map((sparkle) => (
              <div
                key={sparkle.id}
                className="absolute animate-ping"
                style={{
                  top: `${sparkle.top}%`,
                  left: `${sparkle.left}%`,
                  animationDuration: `${sparkle.duration}s`,
                  animationDelay: `${sparkle.delay}s`
                }}
              >
                <Sparkles className="w-4 h-4 text-indigo-300/50" />
              </div>
            ))}

            {/* Particules lumineuses */}
            {particleElements.map((particle) => (
              <div
                key={particle.id}
                className="absolute"
                style={{
                  top: `${particle.top}%`,
                  left: `${particle.left}%`,
                }}
              >
                <div
                  className="w-2 h-2 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full animate-ping"
                  style={{
                    animationDuration: `${particle.duration}s`,
                    animationDelay: `${particle.delay}s`
                  }}
                ></div>
              </div>
            ))}
          </>
        )}

        {/* Static animated icons - these are fine for SSR */}
        <div className="absolute top-20 left-16 animate-pulse" style={{animationDuration: '2s'}}>
          <Lightbulb className="w-8 h-8 text-yellow-400/60" />
        </div>
        <div className="absolute top-32 right-20 animate-bounce" style={{animationDuration: '3s', animationDelay: '1s'}}>
          <Brain className="w-10 h-10 text-purple-400/70" />
        </div>
        <div className="absolute bottom-32 left-24 animate-ping" style={{animationDuration: '2s'}}>
          <Rocket className="w-8 h-8 text-indigo-400/60" />
        </div>
        <div className="absolute bottom-20 right-32 animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}>
          <Target className="w-7 h-7 text-violet-400/60" />
        </div>
        <div className="absolute top-1/3 left-8 animate-spin" style={{animationDuration: '8s'}}>
          <Star className="w-6 h-6 text-yellow-300/50" />
        </div>
        <div className="absolute bottom-1/3 right-12 animate-spin" style={{animationDuration: '10s'}}>
          <Infinity className="w-8 h-8 text-purple-300/60" />
        </div>

        {/* Éclairs d'énergie */}
        <div className="absolute top-1/4 right-1/4 animate-ping" style={{animationDuration: '1.5s'}}>
          <Zap className="w-6 h-6 text-yellow-400/70" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-ping" style={{animationDuration: '2s', animationDelay: '1s'}}>
          <Zap className="w-5 h-5 text-yellow-300/60" />
        </div>

        {/* Formes géométriques en rotation */}
        <div className="absolute top-1/5 left-1/5 w-40 h-40 border-2 border-purple-200/20 rounded-full animate-spin" 
             style={{animationDuration: '25s'}}></div>
        <div className="absolute bottom-1/5 right-1/5 w-32 h-32 border-2 border-violet-200/30 rotate-45 animate-spin" 
             style={{animationDuration: '20s', animationDirection: 'reverse'}}></div>
        <div className="absolute top-1/2 left-12 w-24 h-24 border-2 border-indigo-200/25 rounded-lg animate-spin" 
             style={{animationDuration: '15s'}}></div>

        {/* Lignes de connexion neuronale */}
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 1200 800">
          <defs>
            <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {Array.from({ length: 6 }, (_, i) => (
            <path
              key={i}
              d={`M${100 + i * 150},${100 + i * 80} Q${300 + i * 100},${150 + i * 60} ${500 + i * 120},${120 + i * 70} T${800 + i * 80},${140 + i * 50}`}
              stroke="url(#neuralGradient)"
              strokeWidth="1.5"
              fill="none"
              className="animate-pulse"
              style={{
                animationDuration: `${3 + i * 0.5}s`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-4xl">
          {/* Logo principal avec halo */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 p-6 rounded-full inline-block shadow-2xl">
              <Brain className="w-16 h-16 text-white animate-pulse" />
              <div className="absolute -top-2 -right-2 bg-yellow-400 p-1 rounded-full animate-bounce">
                <Lightbulb className="w-4 h-4 text-yellow-800" />
              </div>
            </div>
          </div>

          {/* Titre principal */}
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent mb-6 animate-pulse">
            IdeazBot
          </h1>
          
          {/* Sous-titre avec effet de machine à écrire */}
          <div className="text-2xl md:text-3xl font-medium text-gray-700 mb-8 overflow-hidden">
            <div className="flex justify-center items-center space-x-4 animate-slide-left">
              {["INSPIRE", "DEVELOP", "ENGAGE", "ACHIEVE"].map((word, index) => (
                <span
                  key={word}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent font-bold whitespace-nowrap"
                  style={{
                    animationDelay: `${index * 0.8}s`,
                    animationDuration: '3s',
                    animationFillMode: 'both'
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Votre assistant IA intelligent pour l'idéation et le brainstorming créatif. 
            Générez des idées innovantes, explorez des concepts révolutionnaires et donnez vie à vos projets 
            les plus ambitieux grâce à la puissance de l'intelligence artificielle conversationnelle.
          </p>
        </div>

        {/* Section utilisateur ou CTA */}
        {user ? (
          /* Utilisateur connecté */
          <div className="backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center max-w-md w-full">
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-4 rounded-full inline-block mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Bienvenue, {user.prenom} {user.nom} !
            </h2>
            <p className="text-gray-600 mb-6">
              Prêt à transformer vos idées en réalité ?
            </p>
            <Link 
              href="/dashboard"
              className="group inline-flex w-full items-center justify-center bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <Play className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Commencer à créer
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          /* Utilisateur non connecté - Design innovant */
          <div className="relative group mb-8 max-w-2xl w-full">
            {/* Effet de halo pulsant */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 animate-pulse"></div>
            
            {/* Container principal */}
            <div className="relative bg-gradient-to-br from-white/90 via-white/80 to-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/30 shadow-2xl">
              {/* Header avec animation flottante */}
              <div className="text-center mb-8 relative">
                <div className="flex justify-center mb-6 relative">
                  {/* Cercles concentriques animés */}
                  <div className="absolute w-24 h-24 rounded-full border-2 border-purple-300/30 animate-spin" style={{animationDuration: '8s'}}></div>
                  <div className="absolute w-32 h-32 rounded-full border border-violet-200/20 animate-spin" style={{animationDuration: '12s', animationDirection: 'reverse'}}></div>
                  
                  {/* Logo central avec effet magnétique */}
                  <div className="relative z-10 bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 p-5 rounded-2xl shadow-xl transform group-hover:scale-110 transition-all duration-500">
                    <Rocket className="w-10 h-10 text-white animate-bounce" />
                    {/* Particules flottantes autour */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-violet-700 to-indigo-700 bg-clip-text text-transparent mb-3">
                  Prêt à innover ?
                </h2>
                <p className="text-gray-600 text-lg">
                  Libérez le potentiel créatif de votre esprit
                </p>
              </div>

              {/* Boutons avec design révolutionnaire */}
              <div className="space-y-4">
                {/* Bouton S'inscrire avec effet holographique */}
                <Link 
                  href="/Inscription"
                  className="group relative w-full inline-block overflow-hidden bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-[1.03]"
                >
                  {/* Effet de lumière qui bouge */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="relative flex items-center justify-center">
                    <Brain className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                    <span className="text-lg">Commencer l'aventure</span>
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </Link>
                
                {/* Bouton Se connecter avec effet néon */}
                <Link 
                  href="/Connexion"
                  className="group relative w-full inline-block bg-transparent border-2 border-purple-300 hover:border-purple-500 text-purple-700 hover:text-purple-800 font-bold py-5 px-8 rounded-2xl transition-all duration-300 hover:bg-purple-50/50 transform hover:scale-[1.02] overflow-hidden"
                >
                  {/* Effet néon au survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/10 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative flex items-center justify-center">
                    <Users className="mr-3 h-6 w-6 group-hover:animate-bounce" />
                    <span className="text-lg">J'ai déjà un compte</span>
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </Link>
              </div>

              {/* Indicateur de fonctionnalités */}
              <div className="mt-8 flex justify-center space-x-6">
                {[
                  { Icon: Lightbulb, label: "IA Creative" },
                  { Icon: Zap, label: "Instantané" },
                  { Icon: Star, label: "Gratuit" }
                ].map(({ Icon, label }, index) => (
                  <div
                    key={label}
                    className="flex flex-col items-center group/item opacity-70 hover:opacity-100 transition-opacity duration-200"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="bg-gradient-to-br from-purple-100 to-violet-100 p-2 rounded-lg mb-1 group-hover/item:scale-110 transition-transform duration-200">
                      <Icon className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section des fonctionnalités */}
        <div className="max-w-6xl w-full mb-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Fonctionnalité 1 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-lg w-fit mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">IA Créative</h3>
              <p className="text-gray-600">
                Générez des idées innovantes grâce à notre IA spécialisée dans la créativité et l'innovation.
              </p>
            </div>

            {/* Fonctionnalité 2 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-3 rounded-lg w-fit mb-4">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Brainstorming Intelligent</h3>
              <p className="text-gray-600">
                Explorez des concepts révolutionnaires avec des sessions de brainstorming guidées par l'IA.
              </p>
            </div>

            {/* Fonctionnalité 3 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-lg w-fit mb-4">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Projets Ambitieux</h3>
              <p className="text-gray-600">
                Donnez vie à vos projets les plus ambitieux avec l'assistance de notre intelligence artificielle.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="animate-bounce">
          <ChevronDown className="w-8 h-8 text-purple-400/60" />
        </div>
      </div>
    </div>
  );
}