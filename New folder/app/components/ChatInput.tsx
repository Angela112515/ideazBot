import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { ideationApi } from '../services/api';

interface ChatInputProps {
  onMessageSent: (message: string, response: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onMessageSent, isLoading, setIsLoading }) => {
  const [inputText, setInputText] = useState('');  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.replace('/Connexion');
      return;
    }

    const message = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        onMessageSent(message, {
          success: true,
          data: data.message // Using the message field from Flask backend
        });
      } else {
        onMessageSent(message, {
          success: false,
          error: data.error || 'Une erreur est survenue'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      onMessageSent(message, {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    } finally {
      // Minimum delay of 5 seconds between requests
      setTimeout(() => {
        setIsLoading(false);
      }, 5000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-end space-x-3">
      <div className="flex-1 relative">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Décrivez votre idée, votre projet ou posez votre question..."
          className="w-full p-4 border-2 border-purple-200/50 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500 transition-all duration-200"
          rows={3}
          disabled={isLoading}
        />
        <div className="absolute bottom-2 right-2 text-xs text-purple-400">
          {inputText.length}/1000
        </div>
      </div>
      
      <button
        onClick={handleSendMessage}
        disabled={!inputText.trim() || isLoading}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-4 rounded-2xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
      >
        {isLoading ? (
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};
