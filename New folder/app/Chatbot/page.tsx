'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Brain,
  Lightbulb,
  Send,
  Sparkles,
  Bot,
  User,
  Rocket,
  Zap,
  History,
  Download,
  Plus,
  MessageCircle,
  X,
  Search,
  Trash2,
  FileText,
  Paperclip,
  AlertCircle
} from "lucide-react";
import { UserData, Message, FileData, Conversation, FileUploadProps, FloatingHistoryPanelProps, ChatMessageProps, ErrorAlertProps } from '../types';

// Composant d'arrière-plan animé
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Lumières flottantes */}
      <div className="absolute w-32 h-32 rounded-full top-20 left-10 bg-purple-300/20 blur-xl animate-pulse"></div>
      <div className="absolute w-24 h-24 rounded-full top-40 right-20 bg-blue-300/20 blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute w-40 h-40 rounded-full bottom-32 left-1/4 bg-indigo-300/15 blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute w-20 h-20 rounded-full top-1/3 right-1/3 bg-purple-400/25 blur-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>

      {/* Cerveaux flottants */}
      <div className="absolute top-1/4 left-1/2 opacity-5 animate-float">
        <Brain className="w-16 h-16 text-purple-600 transform rotate-12" />
      </div>
      <div className="absolute bottom-1/4 right-1/4 opacity-5 animate-float" style={{ animationDelay: '1.5s' }}>
        <Brain className="w-12 h-12 text-blue-600 transform -rotate-12" />
      </div>
      <div className="absolute top-1/2 left-1/4 opacity-5 animate-float" style={{ animationDelay: '0.8s' }}>
        <Lightbulb className="text-indigo-600 transform rotate-45 w-14 h-14" />
      </div>

      {/* Particules flottantes */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-20 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

// Hook pour gérer l'authentification utilisateur
const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error("No token found");
        }
        
        // Ensure we handle userInfo object from login
        const storedUser = sessionStorage.getItem('userInfo');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            nom: parsedUser.nom || parsedUser.email?.split('@')[0] || "Utilisateur",
            prenom: parsedUser.prenom || "",
            email: parsedUser.email || "",
            id: parsedUser.id || 0
          });
        } else {
          // Default fallback if real user data isn't in sessionStorage but token is present
          setUser({
            nom: "Utilisateur",
            prenom: "",
            email: "",
            id: 0
          });
        }
      } catch (error) {
        console.error('Erreur d\'authentification:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return { user, loading };
};

// FileUpload component
const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files).map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));
      onFileUpload(fileArray);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="p-2 text-purple-600 transition-colors hover:bg-purple-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        title="Joindre un fichier"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Paperclip className={`w-5 h-5 ${isDragging ? 'animate-bounce' : ''}`} />
      </button>
    </div>
  );
};

// FloatingHistoryPanel component
const FloatingHistoryPanel: React.FC<FloatingHistoryPanelProps> = ({
  isOpen,
  onClose,
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((conv: Conversation) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesTitle = conv.title.toLowerCase().includes(searchLower);
    const matchesPreview = conv.preview && conv.preview.toLowerCase().includes(searchLower);
    const matchesMessages = conv.messages && conv.messages.some(msg => msg.content.toLowerCase().includes(searchLower));
    
    return matchesTitle || matchesPreview || matchesMessages;
  });

  return (
    <div className={`fixed top-4 right-4 w-80 h-[calc(100vh-2rem)] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-200/30 transform transition-all duration-500 z-50 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
      }`}>

      {/* Header avec couleurs IdeazBot */}
      <div className="flex items-center justify-between p-6 border-b border-purple-100/50">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"></div>
          <h3 className="font-semibold text-gray-800">Historique</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 transition-colors rounded-lg hover:text-purple-600 hover:bg-purple-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search bar */}
      <div className="p-4 border-b border-purple-100/50">
        <div className="relative">
          <Search className="absolute w-4 h-4 text-purple-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 text-sm border-0 outline-none bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* New conversation button */}
      <div className="p-4">
        <button
          onClick={() => {
            onNewConversation();
            onClose();
          }}
          className="flex items-center justify-center w-full p-3 space-x-2 text-sm font-medium text-white transition-all duration-200 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle conversation</span>
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune conversation trouvée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv);
                  onClose();
                }}
                className="p-3 transition-all duration-200 border border-transparent cursor-pointer group rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-200/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {conv.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {conv.preview}
                    </p>
                    <p className="mt-1 text-xs text-purple-400">{conv.timestamp}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="p-1 text-gray-400 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isBot, onDownload }) => {
  const handleDownload = (file: FileData) => {
    if (onDownload) {
      onDownload(file);
    }
  };

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`flex items-start space-x-3 max-w-[80%] ${!isBot ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${isBot
          ? 'bg-gradient-to-r from-purple-600 to-blue-600'
          : 'bg-gradient-to-r from-gray-600 to-gray-700'
          }`}>
          {isBot ? (
            <Brain className="w-5 h-5 text-white" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Message content */}
        <div className={`p-4 rounded-2xl shadow-sm border max-w-full ${isBot
          ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100/50'
          : 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-200/50'
          }`}>
          <div className="mb-2 text-sm font-medium text-gray-600">
            {isBot ? 'IdeazBot' : 'Vous'} • {message.timestamp}
          </div>

          {/* Contenu avec support Markdown */}
          <div className={`prose prose-sm max-w-none ${isBot ? 'prose-purple' : 'prose-gray'
            }`}>
            {isBot ? (
              <ReactMarkdown
                components={{
                  // Personnalisation des composants Markdown
                  h1: ({ children }) => <h1 className="pb-2 mb-3 text-xl font-bold font-black text-purple-800 border-b border-purple-200">{children}</h1>,
                  h2: ({ children }) => <h2 className="mt-4 mb-2 text-lg font-bold text-purple-700">{children}</h2>,
                  h3: ({ children }) => <h3 className="mt-3 mb-2 text-base font-bold text-purple-600">{children}</h3>,
                  h4: ({ children }) => <h4 className="mt-3 mb-2 text-sm font-bold text-purple-600">{children}</h4>,
                  h5: ({ children }) => <h5 className="mt-2 mb-2 text-sm font-bold text-purple-600">{children}</h5>,
                  h6: ({ children }) => <h6 className="mt-2 mb-2 text-xs font-bold text-purple-600">{children}</h6>,
                  p: ({ children }) => {
                    // Fonction utilitaire pour extraire le texte de manière sécurisée
                    const getTextContent = (children) => {
                      if (typeof children === 'string') return children;
                      if (Array.isArray(children)) {
                        return children.map(child =>
                          typeof child === 'string' ? child :
                            typeof child === 'object' && child?.props?.children ?
                              getTextContent(child.props.children) : ''
                        ).join('');
                      }
                      return '';
                    };

                    const childText = getTextContent(children);

                    // Détection des méthodes d'idéation pour les mettre en gras
                    if (childText && (
                      childText.includes('🎬 Storyboarding') ||
                      childText.includes('🎩 6 chapeaux de Bono') ||
                      childText.includes('🗺 Mind Mapping') ||
                      childText.includes('💭 Brainstorming') ||
                      childText.includes('🔄 Design Thinking') ||
                      childText.includes('⚡ SCAMPER'))) {
                      return <p className="mb-2 font-bold leading-relaxed text-gray-700 text-purple-800">{children}</p>;
                    }

                    // Détection des sections principales avec flèches
                    if (childText && (
                      childText.includes('Besoins identifiés :') ||
                      childText.includes('Tendances actuelles :') ||
                      childText.includes('Opportunités :') ||
                      childText.includes('Nom :') ||
                      childText.includes('Avantages clés :'))) {
                      return (
                        <p className="flex items-start mb-2 leading-relaxed text-gray-700">
                          <span className="mr-2 text-lg font-bold text-blue-600">▶</span>
                          <span className="font-semibold text-purple-700">{children}</span>
                        </p>
                      );
                    }

                    // Détection spéciale pour la description (en noir)
                    if (childText && childText.includes('Description :')) {
                      return (
                        <p className="flex items-start mb-2 leading-relaxed text-gray-700">
                          <span className="mr-2 text-lg font-bold text-blue-600">▶</span>
                          <span className="font-semibold text-gray-900">{children}</span>
                        </p>
                      );
                    }

                    return <p className="mb-2 leading-relaxed text-gray-700">{children}</p>;
                  },
                  ul: ({ children }) => <ul className="mb-3 ml-6 space-y-1 list-none">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 ml-4 space-y-1 list-decimal list-inside">{children}</ol>,
                  // Modification de la liste avec différents symboles selon le contexte
                  li: ({ children }) => {
                    // Fonction utilitaire pour extraire le texte de manière sécurisée
                    const getTextContent = (children) => {
                      if (typeof children === 'string') return children;
                      if (Array.isArray(children)) {
                        return children.map(child =>
                          typeof child === 'string' ? child :
                            typeof child === 'object' && child?.props?.children ?
                              getTextContent(child.props.children) : ''
                        ).join('');
                      }
                      return '';
                    };

                    const childText = getTextContent(children);

                    // Pour les sous-éléments des sections principales
                    if (childText) {
                      // Détection des éléments de méthodes, besoins, tendances, etc.
                      const isSubItem = childText.includes('Optimisation') ||
                        childText.includes('Amélioration') ||
                        childText.includes('Réduction') ||
                        childText.includes('Accès') ||
                        childText.includes('Agriculture') ||
                        childText.includes('Développement') ||
                        childText.includes('Importance') ||
                        childText.includes('Forte demande') ||
                        childText.includes('Potentiel') ||
                        childText.includes('Innovation') ||
                        childText.includes('Engagement') ||
                        childText.includes('Solutions') ||
                        childText.includes('Digitalisation') ||
                        childText.includes('Personnalisation') ||
                        childText.includes('Expérience') ||
                        childText.includes('Nouveaux canaux') ||
                        childText.includes('Technologies') ||
                        childText.includes('Communautés') ||
                        childText.includes('Augmentation') ||
                        childText.includes('Collecte') ||
                        childText.includes('Croissance') ||
                        childText.includes('Essor') ||
                        childText.includes('Gamification') ||
                        childText.includes('Demande croissante') ||
                        childText.includes('Possibilité') ||
                        childText.includes('Facilite') ||
                        childText.includes('Crée') ||
                        childText.includes('Favorise') ||
                        childText.includes('Soutien');

                      if (isSubItem) {
                        return (
                          <li className="flex items-start ml-4 text-gray-700">
                            <span className="mr-2"></span>
                            <span>{children}</span>
                          </li>
                        );
                      }
                    }

                    // Flèche par défaut pour les autres éléments (sauf les éléments de base)
                    const isBasicListItem = childText && (
                      childText.includes('Croissance') ||
                      childText.includes('Essor') ||
                      childText.includes('Gamification') ||
                      childText.includes('Demande croissante') ||
                      childText.includes('Possibilité') ||
                      childText.includes('Facilite') ||
                      childText.includes('Crée') ||
                      childText.includes('Favorise') ||
                      childText.includes('Optimisation') ||
                      childText.includes('Amélioration') ||
                      childText.includes('Réduction') ||
                      childText.includes('Accès') ||
                      childText.includes('Soutien') ||
                      childText.includes('Développement')
                    );

                    if (isBasicListItem) {
                      return (
                        <li className="flex items-start ml-4 text-gray-700">
                          <span className="mr-2"></span>
                          <span>{children}</span>
                        </li>
                      );
                    }

                    return (
                      <li className="flex items-start text-gray-700">
                        <span className="mr-2 font-bold text-purple-500">→</span>
                        <span>{children}</span>
                      </li>
                    );
                  },
                  strong: ({ children }) => <strong className="font-bold text-purple-800">{children}</strong>,
                  em: ({ children }) => <em className="italic text-purple-600">{children}</em>,
                  hr: () => <hr className="my-4 border-purple-200" />,
                  blockquote: ({ children }) => (
                    <blockquote className="py-2 pl-4 mb-3 border-l-4 border-purple-300 rounded-r-lg bg-purple-50/50">
                      {children}
                    </blockquote>
                  ),
                  code: ({ inline, children }) => (
                    inline ? (
                      <code className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <pre className="p-3 mb-3 overflow-x-auto bg-gray-100 rounded-lg">
                        <code className="font-mono text-sm text-gray-800">{children}</code>
                      </pre>
                    )
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="text-gray-700">{message.content}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonction API corrigée avec meilleure gestion des erreurs
const callAIAPI = async (content: string, files: FileData[] = []) => {
  try {
    console.log('Sending request with content:', content);

    // Simplified request body
    const requestBody = {
      topic: content
    };

    //  const response = await fetch('http://localhost:4400/api/ideation', {
    // method: 'POST',
    // headers: {
    // 'Content-Type': 'application/json',
    //   },
    //    body: JSON.stringify(requestBody)
    // }); 

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

    //const data = await response.json();
    //console.log('Response data:', data);

    //if (!data || !data.success) {
    //  throw new Error('Invalid response format');
    //  }

    // Format the response
    if (data.data?.etapes) {
      const etapes = data.data.etapes;
      return [
        `🔄 ${etapes.reformulation || ''}`,
        `\n📝 Contexte: ${etapes.contexte || ''}`,
        `\n💡 Idées générées:`,
        ...(etapes.idees || []).map((idee: string) => `\n  • ${idee}`),
        `\n🎯 Idées sélectionnées:`,
        ...(etapes.selection || []).map((idee: string) => `\n  • ${idee}`),
        `\n💭 Concept final: ${etapes.concept || ''}`,
        `\n🔬 Test proposé: ${etapes.test || ''}`,
        etapes.mindmap ? `\n\n🗺️ Mind Map:\n${etapes.mindmap}` : ''
      ].join('');
    }

    return data.message || 'Pas de contenu généré';

  } catch (error) {
    console.error('API call error:', error);
    throw error instanceof Error
      ? error
      : new Error('Une erreur inattendue est survenue');
  }
};

// ErrorAlert component
const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="flex items-start p-4 mb-4 space-x-3 border border-red-200 bg-red-50 rounded-xl">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-medium text-red-800">Erreur de connexion</h4>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
      <button
        onClick={onClose}
        className="text-red-400 transition-colors hover:text-red-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Composant principal IdeazBot
const IdeazBotInterface = () => {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIdeationComplete, setIsIdeationComplete] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Gestion des fichiers uploadés
  const handleFileUpload = (files: File[]) => {
    const fileObjects = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...fileObjects]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now(),
      content: inputText || "Fichier(s) partagé(s)",
      isBot: false,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      files: uploadedFiles.length > 0 ? uploadedFiles : null
    };

    setMessages(prev => [...prev, userMessage]);
    const messageCopy = inputText;
    const filesCopy = [...uploadedFiles];
    setInputText('');
    setUploadedFiles([]);
    setIsLoading(true);
    setIsIdeationComplete(false); // Reset ideation status for new message

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageCopy, conversationId: currentConversationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur inattendue de l\'API');
      }
      if (!data.success) {
        throw new Error(data.error || 'La réponse a échoué');
      }

      // Format the bot response from Flask backend
      const formattedContent = data.message || 'Pas de contenu généré';

      const botResponse: Message = {
        id: Date.now() + 1,
        content: formattedContent,
        isBot: true,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botResponse]);
      setIsIdeationComplete(true); // Mark ideation as complete after receiving response

      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
        fetchConversations(); // refresh list to show newly created conversation
      }

    } catch (error) {
      console.error('Erreur:', error);
      let errorMsg = 'Une erreur inattendue est survenue.';

      if (error instanceof Error) {
        if (error.message.includes('429')) {
          errorMsg = 'Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.';
        } else if (error.message.includes('Invalid response format')) {
          errorMsg = 'Format de réponse invalide. L\'équipe technique a été notifiée.';
        } else if (error.message.includes('Quota exceeded')) {
          errorMsg = 'Quota d\'utilisation dépassé. Veuillez réessayer plus tard.';
        } else if (error.message.includes('API key')) {
          errorMsg = 'Erreur de configuration. L\'équipe technique a été notifiée.';
        } else {
          errorMsg = `${error.message}. Veuillez réessayer dans quelques instants.`;
        }
      }

      const errorMessage: Message = {
        id: Date.now() + 1,
        content: `⚠️ Désolé, une erreur s'est produite : ${errorMsg}`,
        isBot: true,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsIdeationComplete(false); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversation(null);
    setCurrentConversationId(null);
    setUploadedFiles([]);
    setIsIdeationComplete(false);
    setInputText('');
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setCurrentConversation(conv);
    setCurrentConversationId(conv.id);
    setMessages([]);
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:5000/api/conversations/${conv.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`http://localhost:5000/api/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (currentConversationId === id) {
        handleNewConversation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadConversation = () => {
    const conversationText = messages.map(msg =>
      `${msg.isBot ? 'IdeazBot' : 'Vous'} (${msg.timestamp}):\n${msg.content}\n\n`
    ).join('');

    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ideazbot-conversation-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Connexion en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Arrière-plan animé */}
      <AnimatedBackground />

      {/* Header avec branding IdeazBot */}
      <header className="sticky top-0 z-10 border-b shadow-sm border-purple-200/30 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl px-6 py-4 mx-auto">
          <div className="flex items-center justify-between">
            {/* Left side - Logo et branding */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                    IdeazBot
                  </h1>
                  <p className="text-xs font-medium text-purple-500">Intelligence Créative</p>
                </div>
              </div>
              <div className="w-px h-8 bg-purple-200"></div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {getGreeting()}, {user?.prenom || user?.nom}
                </h2>
                <p className="text-sm text-purple-600">Prêt à générer des idées innovantes ?</p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center px-3 py-1 space-x-2 border border-green-200 rounded-full bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-600">IA Active</span>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={downloadConversation}
                  className="p-2 text-purple-600 transition-colors hover:bg-purple-50 rounded-xl"
                  title="Télécharger la conversation"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setHistoryOpen(true)}
                className="relative p-2 text-purple-600 transition-colors hover:bg-purple-50 rounded-xl"
                title="Historique des conversations"
              >
                <History className="w-5 h-5" />
                <div className="absolute flex items-center justify-center w-3 h-3 rounded-full -top-1 -right-1 bg-gradient-to-r from-purple-500 to-blue-500">
                  <span className="text-xs font-bold text-white">{conversations.length}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col h-full max-w-5xl mx-auto">
          {/* Messages */}
          <div className="flex-1 px-6 pt-6 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="flex items-center justify-center w-20 h-20 mb-6 shadow-xl bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl">
                  <Lightbulb className="w-10 h-10 text-white" />
                </div>
                <h2 className="mb-3 text-3xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                  Créons ensemble votre prochaine grande idée
                </h2>
                <p className="max-w-lg mb-8 text-lg text-gray-600">
                  Décrivez votre projet, vos défis ou vos objectifs. IdeazBot vous accompagne avec des insights personnalisés et des solutions créatives.
                </p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 text-purple-600">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">Génération d'idées</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Rocket className="w-5 h-5" />
                    <span className="text-sm font-medium">Innovation guidée</span>
                  </div>
                  <div className="flex items-center space-x-2 text-indigo-600">
                    <Zap className="w-5 h-5" />
                    <span className="text-sm font-medium">Solutions rapides</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isBot={message.isBot}
                  />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-blue-600">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="p-4 border bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border-purple-100/50">
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-bounce"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-purple-600">IdeazBot réfléchit...</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area avec design IdeazBot */}          <div className="p-6 border-t border-purple-200/30 bg-white/50 backdrop-blur-sm">
            {isIdeationComplete ? (
              <div className="flex flex-col items-center justify-center p-6">
                <div className="mb-4 text-center">
                  <h3 className="mb-2 text-lg font-semibold text-purple-800">Idées générées avec succès !</h3>
                  <p className="text-sm text-gray-600">Vous pouvez maintenant générer une mindmap pour visualiser vos idées</p>
                </div>                <button
                  onClick={() => {
                    // Sauvegarder les données actuelles dans le localStorage
                    const mindmapData = {
                      messages: messages.filter(msg => msg.isBot), // Ne garder que les réponses du bot
                      timestamp: new Date().toISOString()
                    };
                    localStorage.setItem('mindmapData', JSON.stringify(mindmapData));
                    // Rediriger vers la page de mindmap
                    window.location.href = '/Mindmap';
                  }}
                  className="flex items-center px-6 py-4 space-x-3 text-white transition-all duration-200 transform bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 hover:shadow-xl"
                >
                  <Brain className="w-6 h-6" />
                  <span className="text-lg font-medium">Générer une mindmap</span>
                </button>
                <button
                  onClick={() => {
                    handleNewConversation();
                    setIsIdeationComplete(false);
                    setInputText('');
                  }}
                  className="mt-4 text-sm text-purple-600 underline hover:text-purple-800"
                >
                  Commencer une nouvelle idéation
                </button>
              </div>
            ) : (
              <>
                {/* Fichiers uploadés */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center p-2 space-x-2 text-sm border rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 border-purple-200/50">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-purple-700 truncate max-w-32">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-purple-400 transition-colors hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end space-x-3">
                  <div className="relative flex-1">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Décrivez votre idée, votre projet ou posez votre question..."
                      className="w-full p-4 text-gray-900 placeholder-gray-500 transition-all duration-200 border-2 outline-none resize-none border-purple-200/50 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white/80 backdrop-blur-sm"
                      rows="3"
                    />
                    <div className="absolute text-xs text-purple-400 bottom-2 right-2">
                      {inputText.length}/1000
                    </div>
                  </div>

                  {/* Actions toolbar */}
                  <div className="flex items-center space-x-2">
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={(!inputText.trim() && uploadedFiles.length === 0) || isLoading}
                      className="p-4 text-white transition-all duration-200 transform shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 rounded-2xl disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 disabled:transform-none"
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
                </div>
              </>
            )}
            <div className="flex items-center justify-between mt-3 text-xs text-purple-500">
              <span>Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne</span>
              <span>Propulsé par IdeazBot AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating History Panel */}
      <FloatingHistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
      />

      {/* Styles CSS personnalisés pour les animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(2deg); }
          50% { transform: translateY(-5px) rotate(-1deg); }
          75% { transform: translateY(-15px) rotate(1deg); }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default IdeazBotInterface;