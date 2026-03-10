interface ApiResponse {
  success: boolean;
  response?: string;
  error?: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    email: string;
  };
  error?: string;
  message?: string;
}

let lastRequestTime = 0;
const MIN_DELAY = 5000; // 5 secondes minimum entre les requêtes
const FLASK_API_URL = 'http://localhost:5000'; // URL du backend Flask

export const authApi = {
  async register(userData: { email: string; password: string }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${FLASK_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error during registration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'inscription'
      };
    }
  },

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${FLASK_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        // Stocker le token dans le localStorage
        localStorage.setItem('authToken', data.token);
      }

      return data;
    } catch (error) {
      console.error('Error during login:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion'
      };
    }
  },

  // Fonction pour vérifier si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  // Fonction pour se déconnecter
  logout(): void {
    localStorage.removeItem('authToken');
  }
};

export const ideationApi = {
  async generateIdeas(message: string): Promise<ApiResponse> {
    const now = Date.now();
    const timeElapsed = now - lastRequestTime;
    
    if (lastRequestTime !== 0 && timeElapsed < MIN_DELAY) {
      throw new Error(`Veuillez attendre ${Math.ceil((MIN_DELAY - timeElapsed) / 1000)} secondes avant de réessayer.`);
    }

    try {
      lastRequestTime = now;
      const response = await fetch(`${FLASK_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur inattendue du serveur');
      }

      return data;
    } catch (error) {
      console.error('Error calling Flask API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      };
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${FLASK_API_URL}/api/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};

export const chatApi = {
  async startConversation(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${FLASK_API_URL}/api/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors du démarrage de la conversation'
      };
    }
  },

  async sendMessage(message: string): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${FLASK_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'envoi du message'
      };
    }
  }
};
