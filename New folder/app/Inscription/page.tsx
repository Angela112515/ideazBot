'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { UserPlus, User, Mail, Lock, Lightbulb, Sparkles, Brain, Zap } from "lucide-react";
import { authApi } from '../services/api';

interface FormData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignUp() {
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const targetText = "INNOVATION";

  // Animation pour écrire "INNOVATION" lettre par lettre
  useEffect(() => {
    if (currentIndex < targetText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + targetText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Une fois terminé, recommencer après une pause
      const resetTimer = setTimeout(() => {
        setDisplayedText('');
        setCurrentIndex(0);
      }, 3000);
      return () => clearTimeout(resetTimer);
    }
  }, [currentIndex, targetText]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer les messages d'erreur quand l'utilisateur tape
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Vérification des champs
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.register({
        email: formData.email,
        password: formData.password
      });

      if (response.success) {
        setSuccess('Inscription réussie! Redirection vers la page de connexion...');
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          window.location.replace('/Connexion');
        }, 2000);
      } else {
        setError(response.error || 'Une erreur est survenue lors de l\'inscription');
      }
    } catch (error) {
      setError('Une erreur est survenue lors de l\'inscription');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    window.location.replace('/Connexion');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-100">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Texte INNOVATION animé */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-6xl font-bold text-purple-200/30 tracking-wider">
            {displayedText}
            <span className="animate-pulse">|</span>
          </div>
        </div>

        {/* Floating Ideas Bubbles */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-purple-200/30 rounded-full animate-bounce" 
             style={{animationDelay: '0s', animationDuration: '3s'}}></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-violet-200/40 rounded-full animate-bounce" 
             style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute bottom-40 left-20 w-20 h-20 bg-indigo-200/30 rounded-full animate-bounce" 
             style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        <div className="absolute bottom-20 right-10 w-14 h-14 bg-purple-300/35 rounded-full animate-bounce" 
             style={{animationDelay: '0.5s', animationDuration: '3.5s'}}></div>
        
        {/* Floating Light Bulbs */}
        <div className="absolute top-32 right-32 animate-pulse" style={{animationDuration: '2s'}}>
          <Lightbulb className="w-8 h-8 text-purple-300/60" />
        </div>
        <div className="absolute bottom-32 left-32 animate-pulse" style={{animationDuration: '2.5s', animationDelay: '1s'}}>
          <Lightbulb className="w-6 h-6 text-violet-300/60" />
        </div>
        
        {/* Animated Brain */}
        <div className="absolute top-16 left-16 animate-pulse" style={{animationDuration: '3s'}}>
          <Brain className="w-10 h-10 text-indigo-300/70" />
        </div>
        <div className="absolute bottom-16 right-16 animate-pulse" style={{animationDuration: '2.5s', animationDelay: '1s'}}>
          <Brain className="w-8 h-8 text-purple-300/60" />
        </div>
        
        {/* Lightning bolts for energy */}
        <div className="absolute top-1/3 right-24 animate-ping" style={{animationDuration: '2s'}}>
          <Zap className="w-6 h-6 text-yellow-400/70" />
        </div>
        <div className="absolute bottom-1/3 left-24 animate-ping" style={{animationDuration: '3s', animationDelay: '1s'}}>
          <Zap className="w-5 h-5 text-yellow-300/60" />
        </div>
        
        {/* Sparkling Stars */}
        <div className="absolute top-16 left-1/3 animate-ping" style={{animationDuration: '3s'}}>
          <Sparkles className="w-5 h-5 text-indigo-300/70" />
        </div>
        <div className="absolute bottom-16 right-1/3 animate-ping" style={{animationDuration: '2s', animationDelay: '1.5s'}}>
          <Sparkles className="w-4 h-4 text-purple-300/70" />
        </div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-purple-200/30 rounded-full animate-spin" 
             style={{animationDuration: '20s'}}></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border-2 border-violet-200/40 rotate-45 animate-spin" 
             style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
        
        {/* Neural Network Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 600">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path d="M100,100 Q200,150 300,100 T500,120 L600,80" 
                stroke="url(#lineGradient)" strokeWidth="2" fill="none" 
                className="animate-pulse" style={{animationDuration: '4s'}} />
          <path d="M150,400 Q300,350 450,400 T650,380" 
                stroke="url(#lineGradient)" strokeWidth="2" fill="none" 
                className="animate-pulse" style={{animationDuration: '3s', animationDelay: '1s'}} />
          <path d="M50,250 Q250,200 450,250 T750,230" 
                stroke="url(#lineGradient)" strokeWidth="2" fill="none" 
                className="animate-pulse" style={{animationDuration: '5s', animationDelay: '2s'}} />
        </svg>

        {/* Lumières flottantes */}
        <div className="absolute top-1/2 left-8">
          <div className="w-4 h-4 bg-yellow-300/60 rounded-full animate-ping" style={{animationDuration: '2s'}}></div>
          <div className="w-2 h-2 bg-yellow-400/80 rounded-full animate-pulse absolute top-1 left-1"></div>
        </div>
        <div className="absolute top-1/3 right-8">
          <div className="w-6 h-6 bg-blue-300/50 rounded-full animate-ping" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
          <div className="w-3 h-3 bg-blue-400/70 rounded-full animate-pulse absolute top-1.5 left-1.5"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Card with glassmorphism effect */}
          <div className="backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-8 text-center relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-2 left-4 w-8 h-8 border border-white/30 rounded-full animate-pulse"></div>
                <div className="absolute top-8 right-6 w-6 h-6 border border-white/30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-4 left-8 w-4 h-4 border border-white/30 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/30 relative">
                    {/* Halo lumineux autour de l'icône */}
                    <div className="absolute inset-0 bg-white/10 rounded-full animate-ping"></div>
                    <div className="bg-white p-2 rounded-full relative z-10">
                      <Brain className="h-12 w-12 text-purple-600 animate-pulse" />
                    </div>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Rejoignez IdeazBot</h1>
                <p className="text-purple-100 text-sm font-medium tracking-wider">
                  CRÉEZ · INNOVEZ · COLLABOREZ
                </p>
                <div className="mt-4 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                </div>
              </div>
            </div>

            {/* Form - CORRECTION PRINCIPALE ICI */}
            <div className="px-8 pb-8 pt-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50/80 border border-red-200 text-red-700 rounded-xl text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50/80 border border-green-200 text-green-700 rounded-xl text-sm backdrop-blur-sm">
                  {success}
                </div>
              )}
              
              {/* FORMULAIRE AVEC ONSUBMIT */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <input
                      id="prenom"
                      name="prenom"
                      type="text"
                      required
                      value={formData.prenom}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-purple-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Prénom"
                    />
                  </div>
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <input
                      id="nom"
                      name="nom"
                      type="text"
                      required
                      value={formData.nom}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-purple-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Nom"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-purple-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-purple-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-purple-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <button
                    onClick={handleSubmit}
                    type="button"
                    disabled={loading}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      {loading ? (
                        <svg className="animate-spin h-5 w-5 text-purple-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <Brain className="h-5 w-5 text-purple-200 group-hover:text-purple-100 transition-colors duration-200" />
                      )}
                    </span>
                    {loading ? 'Inscription en cours...' : 'S\'inscrire'}
                  </button>
                </div>
              </div>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Déjà un compte?{" "}
                  <button 
                    onClick={goToLogin}
                    className="font-medium text-purple-600 hover:text-purple-500 transition-colors duration-200 underline"
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Inspirational Quote */}
          <div className="text-center">
            <p className="text-purple-700/80 text-sm italic backdrop-blur-sm bg-white/30 rounded-2xl p-4 border border-white/40">
              « Le futur appartient à ceux qui croient en la beauté de leurs rêves »
              <span className="block text-xs mt-1 text-purple-600/70">- Eleanor Roosevelt</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}