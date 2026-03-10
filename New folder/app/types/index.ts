export interface UserData {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

export interface FileData {
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: number;
  content: string;
  isBot: boolean;
  timestamp: string;
  files?: File[] | null;
  isError?: boolean;
}

export interface Conversation {
  id: number;
  title: string;
  preview?: string;
  messages: Message[];
  timestamp: string;
}

export interface FileUploadProps {
  onFileUpload: (files: FileData[]) => void;
  disabled: boolean;
}

export interface FloatingHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: number) => void;
  onNewConversation: () => void;
}

export interface ChatMessageProps {
  message: Message;
  isBot: boolean;
  onDownload?: (file: FileData) => void;
}

export interface ErrorAlertProps {
  error: Error;
  onClose: () => void;
}

export interface Etapes {
  reformulation: string;
  contexte: string;
  idees: string[];
  selection: string[];
  concept: string;
  test: string;
  mindmap?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: {
    etapes: Etapes;
  };
  message?: string;
  error?: string;
  details?: any;
  timestamp?: string;
}
