from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from groq import Groq
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
from datetime import timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import markdown
from PIL import Image, ImageDraw, ImageFont
import io
import datetime
import textwrap
from sqlalchemy.sql import func

# Charger les variables d'environnement
load_dotenv(override=True)

app = Flask(__name__)
# Configuration CORS plus précise pour le développement
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],  # Frontend Next.js
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuration de la base de données
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Modèle utilisateur
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    conversations = db.relationship('Conversation', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email
        }

class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False, default="Nouvelle conversation")
    preview = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'preview': self.preview,
            # Format datetime safely
            'timestamp': self.created_at.strftime("%d/%m/%Y %H:%M") if self.created_at else "Récemment",
            'messages': [] # Loaded separately if needed
        }

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversation.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_bot = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    
    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'isBot': self.is_bot,
            'timestamp': self.created_at.strftime("%H:%M") if self.created_at else "12:00"
        }

# Créer les tables
with app.app_context():
    db.create_all()

# Configuration de l'API Groq
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

@app.route('/')
def index():
    return jsonify({
        'status': 'ok',
        'message': 'API Flask en cours d\'exécution',
        'endpoints': {
            'signup': '/api/auth/signup',
            'login': '/api/auth/login'
        }
    })

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Aucune donnée reçue'}), 400
            
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email et mot de passe requis'}), 400

        # Vérifier si l'utilisateur existe déjà
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Cet email est déjà utilisé'}), 400

        # Créer un nouvel utilisateur
        hashed_password = generate_password_hash(password)
        new_user = User(email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Inscription réussie',
            'user': new_user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Aucune donnée reçue'}), 400
            
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email et mot de passe requis'}), 400

        # Vérifier les identifiants
        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password, password):
            return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

        # Créer le token JWT
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'token': access_token,
            'user': user.to_dict()
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Route protégée pour tester l'authentification
@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        return jsonify({
            'success': True,
            'user': user.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

class IdeationSession:
    def __init__(self, conversation_model=None):
        self.conversation_model = conversation_model
        
        # Charger l'historique depuis le modèle si existant
        self.conversation_history = []
        if self.conversation_model:
            for msg in self.conversation_model.messages:
                role = "assistant" if msg.is_bot else "user"
                self.conversation_history.append({"role": role, "content": msg.content})
                
        self.context_gathered = {
            "description": "",
            "secteur": "",
            "cible": "",
            "contraintes": "",
            "objectifs": "",
            "budget": "",
            "timeline": ""
        }

    def get_next_prompt(self, user_input=None):
        if user_input:
            self.conversation_history.append({"role": "user", "content": user_input})
            # Analyser l'input pour extraire le contexte
            self.extract_context_from_input(user_input)
            return self.generate_ideation_response()
            
        # Première interaction
        return "Bonjour ! Je suis votre assistant en idéation créative. Parlez-moi de votre projet ou de votre problématique, et je générerai des idées innovantes adaptées."

    # Méthodes supprimées car plus besoin de la logique de questions

    def extract_context_from_input(self, user_input):
        """Extrait automatiquement le contexte de l'input utilisateur"""
        user_input_lower = user_input.lower()
        
        # Identifier le secteur
        secteurs = {
            'cosmétique': ['cosmétique', 'beauté', 'maquillage', 'loreal', 'sephora', 'parfum'],
            'technologie': ['tech', 'app', 'logiciel', 'digital', 'ia', 'startup'],
            'alimentaire': ['restaurant', 'food', 'cuisine', 'alimentaire', 'boisson'],
            'mode': ['mode', 'vêtement', 'fashion', 'textile', 'prêt-à-porter'],
            'santé': ['santé', 'médical', 'pharma', 'wellness', 'fitness'],
            'éducation': ['école', 'formation', 'éducation', 'cours', 'université'],
            'finance': ['banque', 'finance', 'assurance', 'fintech', 'crédit']
        }
        
        for secteur, keywords in secteurs.items():
            if any(keyword in user_input_lower for keyword in keywords):
                self.context_gathered['secteur'] = secteur
                break
        
        # Identifier la cible
        if any(word in user_input_lower for word in ['jeune', 'ado', 'étudiant', '18-25']):
            self.context_gathered['cible'] = 'Jeunes adultes (18-25 ans)'
        elif any(word in user_input_lower for word in ['famille', 'parent', 'maman', 'papa']):
            self.context_gathered['cible'] = 'Familles'
        elif any(word in user_input_lower for word in ['professionnel', 'entreprise', 'b2b']):
            self.context_gathered['cible'] = 'Professionnels/Entreprises'
        
        # Identifier les contraintes/objectifs
        if any(word in user_input_lower for word in ['budget', 'coût', 'prix', 'économique']):
            self.context_gathered['contraintes'] = 'Budget limité mentionné'
        if any(word in user_input_lower for word in ['urgent', 'rapide', 'vite', 'délai']):
            self.context_gathered['timeline'] = 'Timeline serrée'
        if any(word in user_input_lower for word in ['campagne', 'marketing', 'promotion', 'lancement']):
            self.context_gathered['objectifs'] = 'Campagne marketing/lancement'

    def generate_ideation_response(self):
        # Construire le contexte complet de la conversation
        conversation_summary = self.build_conversation_summary()
        
        # Liste des méthodes d'idéation disponibles avec leurs descriptions
        ideation_methods = [
            ("🌀 Brainstorming libre", "Génération spontanée et fluide d'idées sans contraintes ni jugement"),
            ("🔧 SCAMPER", "Substituer, Combiner, Adapter, Modifier, other Purpose, Éliminer, Réorganiser"),
            ("🎩 6 chapeaux de Bono", "Analyse créative sous différents angles (émotionnel, logique, créatif, etc.)"),
            ("🗺 Mind Mapping", "Cartographie visuelle et structurée des idées et leurs connexions"),
            ("✍ Crazy 8", "8 idées rapides esquissées en 8 minutes pour encourager l'innovation"),
            ("🌉 Métaphore / analogie", "Transposition créative de concepts depuis d'autres domaines"),
            ("🎬 Storyboarding", "Visualisation narrative du parcours utilisateur et des interactions")
        ]
        
        # Sélection aléatoire des méthodes
        import random
        selected_methods = random.sample(ideation_methods, random.randint(1, 2))
        
        # Sélectionner aléatoirement 1-2 méthodes
        import random
        selected_methods = random.sample(ideation_methods, random.randint(1, 2))
        methods_text = "\n".join([f"• {method[0]} : {method[1]}" for method in selected_methods])
        
        # Formatage du texte des méthodes d'idéation
        methods_text = "\n".join([f"• {method[0]} : {method[1]}" for method in selected_methods])
        
        # PROMPT AVEC MÉTHODES D'IDÉATION CHOISIES
        ideation_prompt = f"""Tu es un expert en idéation créative et innovation. Utilise les méthodes sélectionnées pour générer des idées innovantes.
        
⚡ MÉTHODES D'IDÉATION SÉLECTIONNÉES
{methods_text}

CONTEXTE DE LA CONVERSATION:
{conversation_summary}

INFORMATIONS EXTRAITES:
- Secteur: {self.context_gathered.get('secteur', 'À déterminer')}
- Public cible: {self.context_gathered.get('cible', 'À déterminer')}
- Objectifs: {self.context_gathered.get('objectifs', 'À déterminer')}
- Contraintes: {self.context_gathered.get('contraintes', 'À déterminer')}

INSTRUCTIONS:
Génère une réponse extrêmement détaillée et structurée avec EXACTEMENT ce format :

🎯 REFORMULATION DU DÉFI
[Reformule la problématique sous un angle créatif stratégique en 3-4 phrases]

🔍 ANALYSE CONTEXTUELLE
• Besoins stratégiques : [3-4 besoins détaillés]
• Tendances du marché : [3 tendances avec exemples concrets]
• Opportunités : [3 opportunités majeures]

💡 GÉNÉRATION D'IDÉES INNOVANTES
1. [Nom idée 1] :
   - Mécanique centrale : [Description approfondie du fonctionnement]
   - Avantage concurrentiel : [La valeur ajoutée unique]
   - Exemple d'application : [Mise en situation concrète]
2. [Nom idée 2] :
   - Mécanique centrale : [Description approfondie du fonctionnement]
   - Avantage concurrentiel : [La valeur ajoutée unique]
   - Exemple d'application : [Mise en situation concrète]
3. [Nom idée 3] :
   - Mécanique centrale : [Description approfondie du fonctionnement]
   - Avantage concurrentiel : [La valeur ajoutée unique]
   - Exemple d'application : [Mise en situation concrète]
4. [Nom idée 4] :
   - Mécanique centrale : [Description approfondie du fonctionnement]
   - Avantage concurrentiel : [La valeur ajoutée unique]
   - Exemple d'application : [Mise en situation concrète]
5. [Nom idée 5] :
   - Mécanique centrale : [Description approfondie du fonctionnement]
   - Avantage concurrentiel : [La valeur ajoutée unique]
   - Exemple d'application : [Mise en situation concrète]

⭐ TOP 3 RECOMMANDATIONS STRATÉGIQUES
1. [Nom] : [Pourquoi c'est la meilleure idée (Faisabilité, Impact)]
2. [Nom] : [Pourquoi c'est la deuxième meilleure idée]  
3. [Nom] : [Pourquoi c'est la troisième meilleure idée]

🚀 CONCEPT PRINCIPAL (L'idée maîtresse)
• Nom : [Nom accrocheur du concept choisi]
• Description : [Explication approfondie du fonctionnement en 4-5 phrases]
• Avantages clés : 
  - [Avantage 1 justifié]
  - [Avantage 2 justifié]
  - [Avantage 3 justifié]


Adapte le ton (professionnel et inspirant), le vocabulaire et les idées au secteur identifié. Sois exhaustif, concret et percutant."""

        return ideation_prompt

    def build_conversation_summary(self):
        """Construit un résumé de la conversation pour le contexte"""
        if not self.conversation_history:
            return "Aucune conversation précédente."
        
        summary_parts = []
        for i, msg in enumerate(self.conversation_history):
            if msg['role'] == 'user':
                summary_parts.append(f"Utilisateur: {msg['content']}")
        
        return "\n".join(summary_parts[-5:])  # Garde les 5 derniers messages

    def validate_and_format_response(self, response_text):
        """Valide et formate la réponse de Gemini"""
        try:
            # On ne fait plus de validation stricte sur la présence des emojis
            # pour éviter que des réponses valides soient remplacées par le fallback
            
            # Nettoyer et structurer la réponse
            formatted_response = self.clean_response_format(response_text)
            return formatted_response
            
        except Exception as e:
            print(f"Erreur lors du formatage: {str(e)}")
            return self.generate_fallback_response()

    def clean_text(self, text):
        """Nettoie et formate le texte pour assurer sa cohérence"""
        # Supprimer les espaces multiples
        text = ' '.join(text.split())
        
        # S'assurer que chaque phrase commence par une majuscule (sans détruire la casse du reste)
        sentences = text.split('. ')
        sentences = [s[0].upper() + s[1:] if s else s for s in sentences]
        text = '. '.join(sentences)
        
        # S'assurer que le texte se termine par un point si c'est une phrase
        if text and text[-1].isalnum():
            text += '.'
            
        return text

    def clean_response_format(self, response_text):
        """Améliore le formatage de la réponse pour une meilleure lisibilité et cohérence"""
        # Suppression de la phrase finale
        response_text = response_text.replace("💡 Pour approfondir ces idées, n'hésitez pas à me poser des questions !", "")
        
        # Division en sections
        sections = response_text.split('\n')
        formatted_sections = []
        
        current_section = None
        in_list = False
        section_content = []
        
        for line in sections:
            line = line.strip()
            # Nettoyer les traits "-" ou les marqueurs visuels en excès typiques au début/fin si y en a
            if line.startswith('━━') or line.startswith('──'):
                continue
                
            if not line:
                if section_content:
                    formatted_sections.extend(section_content)
                    section_content = []
                continue

            # Nouvelle section principale (avec emoji)
            if any(emoji in line for emoji in ['🎯', '🔍', '💡', '⭐', '🚀']):
                if section_content:
                    formatted_sections.extend(section_content)
                    section_content = []
                
                # Récupérer juste le texte de la section sans les éventuels '===' ou '---'
                clean_header = line.replace('═', '').replace('─', '').strip()
                formatted_sections.extend(["", "", f"**{clean_header}**", ""])
                current_section = line.split()[0]
                in_list = False
                
            # Traitement des listes et sous-sections
            elif line.startswith(('•', '*', '▶', '-')):
                if not in_list:
                    section_content.append("")
                    in_list = True
                
                content = line.lstrip('*•▶-').strip()
                if not content:  # Si le contenu est vide après le marqueur
                    continue
                
                # Ignorer si c'est juste un trait de séparation horizontal
                if content.startswith('─'):
                    continue
                    
                content = self.clean_text(content)
                if content:  # Vérifier que le contenu n'est pas vide après nettoyage
                    bullet_point = '•'
                    section_content.append(f"{bullet_point} {content}")
                    section_content.append("")
                
            # Traitement des idées numérotées
            elif line[0].isdigit() and line[1] in ['.', ')', ':', ' ']:
                num = line[0]
                content = line[2:].strip()
                if not content:  # Si le contenu est vide après le numéro
                    continue
                
                content = self.clean_text(content)
                if content:  # Vérifier que le contenu n'est pas vide après nettoyage
                    if current_section == '💡':
                        section_content.append(f"{num}️⃣ **{content}**")
                    elif current_section == '⭐':
                        medal = '🥇' if num == '1' else '🥈' if num == '2' else '🥉'
                        section_content.append(f"{medal} **{content}**")
                    else:
                        section_content.append(f"{num}. **{content}**")
                        
                    section_content.append("")
                
            # Traitement des sous-sections dans le concept principal
            elif any(line.lower().startswith(prefix.lower()) for prefix in 
                    ['Nom :', 'Description :', 'Avantages clés :', 'Première étape :', 'Points forts :']):
                prefix = line.split(':')[0] + ':'
                content = line.split(':', 1)[1].strip()
                if not content:  # Si le contenu est vide après le préfixe
                    continue
                
                content = self.clean_text(content)
                if content:  # Vérifier que le contenu n'est pas vide après nettoyage
                    section_content.append(f"**{prefix}** {content}")
                    section_content.append("")
                
            # Autres lignes (texte normal)
            else:
                content = self.clean_text(line)
                if content:  # Vérifier que le contenu n'est pas vide après nettoyage
                    # Ignorer si c'est une ligne de tirets
                    if "────" not in content and "━━━━" not in content:
                        section_content.append(content)
                        section_content.append("")

        # Ajouter le dernier contenu de section s'il existe
        if section_content:
            formatted_sections.extend(section_content)

        # Filtrer les lignes vides excessives (pas plus d'une ligne vide consécutive)
        result = []
        prev_empty = False
        for line in formatted_sections:
            if line.strip():
                result.append(line)
                prev_empty = False
            elif not prev_empty:
                result.append(line)
                prev_empty = True
                
        return '\n'.join(result).strip()

    # Méthode de fallback question supprimée

    def generate_fallback_response(self):
        """Génère une réponse de secours personnalisée basée sur le contexte collecté"""
        secteur = self.context_gathered.get('secteur', 'votre secteur')
        cible = self.context_gathered.get('cible', 'votre public cible')
    
        return f"""
**🎯 REFORMULATION DU DÉFI**

Développer une stratégie créative et innovante pour répondre aux besoins spécifiques de {cible} dans {secteur}, en maximisant l'impact et l'engagement.

**🔍 ANALYSE CONTEXTUELLE**

**⚡ MÉTHODES D'IDÉATION**

• 🎩 **6 chapeaux de Bono** : Analyse sous différents angles (émotionnel, logique, créatif, etc.)

• 🗺 **Mind Mapping** : Exploration visuelle des connexions entre idées

**▶ Besoins identifiés :**

• Innovation et différenciation concurrentielle

• Engagement client renforcé

• Solutions adaptatives et évolutives

**▶ Tendances actuelles :**

• Digitalisation accélérée

• Personnalisation poussée

• Expérience utilisateur immersive

**▶ Opportunités :**

• Nouveaux canaux digitaux émergents

• Technologies innovantes

• Communautés engagées

**💡 GÉNÉRATION D'IDÉES**

1️⃣ **Expérience Digitale Interactive**
Plateforme immersive avec gamification pour engager votre audience

2️⃣ **Marketing Collaboratif**
Co-création avec votre communauté pour du contenu authentique

3️⃣ **Approche Omnicanal**
Intégration fluide entre expériences online et offline

4️⃣ **Innovation Durable**
Solutions éco-responsables alignées avec les valeurs actuelles

5️⃣ **Personnalisation Intelligente**
IA et data analytics pour des expériences sur-mesure

**⭐ TOP 3 RECOMMANDATIONS**

🥇 **Expérience Digitale Interactive**
Fort potentiel d'engagement et de viralité dans le contexte actuel

🥈 **Marketing Collaboratif**
Crée de l'authenticité et renforce la relation client

🥉 **Personnalisation Intelligente**
Répond aux attentes de plus en plus élevées des consommateurs

**🚀 CONCEPT PRINCIPAL**

**▶ Nom :**
Écosystème d'Engagement Personnalisé

**▶ Description :**
Création d'une expérience intégrée combinant digital et physique, permettant à votre audience de co-créer, personnaliser et partager leurs expériences selon leurs préférences uniques.

**▶ Avantages clés :**

• Engagement authentique

• Collecte de données précieuses

• Différenciation forte
"""

    def export_mindmap(self, format='markdown'):
        """Exporte la mindmap dans le format spécifié"""
        if not self.conversation_history:
            return None
            
        # Récupérer la dernière réponse formatée
        last_response = self.conversation_history[-1].get('content', '')
        if not last_response:
            return None
            
        if format == 'markdown':
            return last_response
        elif format == 'html':
            # Convertir le markdown en HTML
            html = markdown.markdown(last_response)
            # Ajouter du style CSS basique
            styled_html = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
                    h1 {{ color: #2c3e50; }}
                    .section {{ margin: 20px 0; padding: 10px; border-left: 4px solid #3498db; }}
                    .emoji {{ font-size: 1.5em; }}
                </style>
            </head>
            <body>
                {html}
            </body>
            </html>
            """
            return styled_html
        elif format == 'png':
            # Créer une image du mindmap
            return self._create_mindmap_image(last_response)
        return None

    def _create_mindmap_image(self, text):
        """Crée une image PNG du mindmap"""
        try:
            # Créer une image avec un fond blanc
            width, height = 1200, 1600
            image = Image.new('RGB', (width, height), 'white')
            draw = ImageDraw.Draw(image)
            
            # Charger une police
            try:
                font = ImageFont.truetype("arial.ttf", 20)
                title_font = ImageFont.truetype("arial.ttf", 28)
            except:
                # Fallback sur la police par défaut si arial n'est pas disponible
                font = ImageFont.load_default()
                title_font = ImageFont.load_default()
            
            # Position initiale du texte
            x, y = 40, 40
            max_width = width - 80
            
            # Diviser le texte en lignes
            lines = text.split('\n')
            
            for line in lines:
                if line.strip():
                    # Utiliser une police plus grande pour les titres (lignes avec emoji)
                    current_font = title_font if any(emoji in line for emoji in ['🎯', '🔍', '💡', '⭐', '🚀']) else font
                    
                    # Wrapper le texte pour qu'il rentre dans la largeur
                    wrapped_lines = textwrap.wrap(line, width=80)
                    
                    for wrapped_line in wrapped_lines:
                        # Vérifier si on a besoin d'une nouvelle page
                        if y > height - 40:
                            # Créer une nouvelle image
                            new_image = Image.new('RGB', (width, height), 'white')
                            new_image.paste(image, (0, 0))
                            image = new_image
                            y = 40
                        
                        # Dessiner la ligne
                        draw.text((x, y), wrapped_line, font=current_font, fill='black')
                        y += current_font.size + 10
                
                # Ajouter un espace entre les paragraphes
                y += 10
            
            # Convertir l'image en bytes
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)
            
            return img_byte_arr
            
        except Exception as e:
            print(f"Erreur lors de la création de l'image: {str(e)}")
            return None

    def send_email(self, to_email, format='markdown'):
        """Envoie la mindmap par email"""
        try:
            # Récupérer les identifiants email depuis les variables d'environnement
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            email_user = os.getenv('EMAIL_USER')
            email_password = os.getenv('EMAIL_PASSWORD')
            
            if not all([email_user, email_password]):
                raise ValueError("Configuration email manquante")
            
            # Créer le message
            msg = MIMEMultipart()
            msg['From'] = email_user
            msg['To'] = to_email
            msg['Subject'] = "Votre Mindmap d'Idéation"
            
            # Obtenir le contenu de la mindmap
            content = self.export_mindmap(format)
            if not content:
                raise ValueError("Aucun contenu à envoyer")
            
            # Ajouter le contenu au message
            if format == 'html':
                msg.attach(MIMEText(content, 'html'))
            else:
                msg.attach(MIMEText(content, 'plain'))
            
            # Envoyer l'email
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(email_user, email_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email: {str(e)}")
            return False

# Variable globale pour stocker les sessions d'idéation (utiliser par conversation_id plutôt que user_id)
ideation_sessions = {}

@app.route('/api/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    try:
        current_user_id = get_jwt_identity()
        conversations = Conversation.query.filter_by(user_id=current_user_id).order_by(Conversation.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'conversations': [c.to_dict() for c in conversations]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/conversations/<int:conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation_messages(conversation_id):
    try:
        current_user_id = get_jwt_identity()
        conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user_id).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation non trouvée'}), 404
            
        messages = Message.query.filter_by(conversation_id=conversation.id).order_by(Message.created_at.asc()).all()
        
        # Formater comme attendu par le frontend
        formatted_messages = []
        for msg in messages:
            formatted_messages.append(msg.to_dict())
            
        return jsonify({
            'success': True,
            'messages': formatted_messages
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/conversations/<int:conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    try:
        current_user_id = get_jwt_identity()
        conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user_id).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation non trouvée'}), 404
            
        db.session.delete(conversation)
        db.session.commit()
        
        # Supprimer aussi de la session mémoire
        session_key = f"{current_user_id}_{conversation_id}"
        if session_key in ideation_sessions:
            del ideation_sessions[session_key]
            
        return jsonify({
            'success': True,
            'message': 'Conversation supprimée'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/chat/start', methods=['POST'])
@jwt_required()
def start_chat():
    try:
        current_user_id = get_jwt_identity()
        
        # Créer une nouvelle conversation en base de données
        new_conv = Conversation(user_id=current_user_id, title="Nouvelle conversation")
        db.session.add(new_conv)
        db.session.commit()
        
        # L'associer à une session en mémoire
        session_key = f"{current_user_id}_{new_conv.id}"
        ideation_sessions[session_key] = IdeationSession(new_conv)
        
        welcome_message = ideation_sessions[session_key].get_next_prompt()
        
        # Sauvegarder le message de bienvenue (bot)
        bot_msg = Message(conversation_id=new_conv.id, content=welcome_message, is_bot=True)
        db.session.add(bot_msg)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'conversationId': new_conv.id,
            'message': welcome_message
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def chat():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        message = data.get('message')
        conversation_id = data.get('conversationId')
        
        if not message:
            return jsonify({'error': 'Message requis'}), 400

        # Si pas de conversation_id, créer une nouvelle conversation implicitement
        if not conversation_id:
            new_conv = Conversation(user_id=current_user_id, title=message[:50] + "..." if len(message) > 50 else message)
            db.session.add(new_conv)
            db.session.commit()
            conversation_id = new_conv.id
            session_key = f"{current_user_id}_{conversation_id}"
            ideation_sessions[session_key] = IdeationSession(new_conv)
        else:
            # Vérifier l'appartenance
            conv = Conversation.query.filter_by(id=conversation_id, user_id=current_user_id).first()
            if not conv:
                return jsonify({'error': 'Conversation non trouvée ou non autorisée'}), 403
                
            session_key = f"{current_user_id}_{conversation_id}"
            if session_key not in ideation_sessions:
                ideation_sessions[session_key] = IdeationSession(conv)
                
            # Mettre à jour le titre s'il était à "Nouvelle conversation"
            if conv.title == "Nouvelle conversation":
                conv.title = message[:50] + "..." if len(message) > 50 else message
                # Optionnellement définir le preview
                conv.preview = "En cours d'idéation..."
                db.session.commit()

        # Enregistrer le message de l'utilisateur
        user_msg = Message(conversation_id=conversation_id, content=message, is_bot=False)
        db.session.add(user_msg)
        db.session.commit()
        
        session = ideation_sessions[f"{current_user_id}_{conversation_id}"]
        prompt = session.get_next_prompt(message)

        try:
            # Génération d'idées avec Groq (Llama 3 70B)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                top_p=0.9,
                max_tokens=1500,
            )
            
            if not response or not response.choices or not response.choices[0].message.content:
                raise ValueError("Réponse vide de l'API Groq")

            response_text = response.choices[0].message.content

            # Utiliser la nouvelle méthode de validation et formatage
            formatted_response = session.validate_and_format_response(response_text.strip())
            
            # Sauvegarder la réponse du bot
            bot_msg = Message(conversation_id=conversation_id, content=formatted_response, is_bot=True)
            db.session.add(bot_msg)
            
            # Mettre à jour le preview de la conversation
            conv_to_update = Conversation.query.get(conversation_id)
            if conv_to_update:
                conv_to_update.preview = "Réponse générée..."
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': formatted_response,
                'conversationId': conversation_id,
                'clarification_complete': True
            })
            
        except Exception as api_error:
            import traceback
            print("="*50)
            print(f"ERREUR LORS DE LA GÉNÉRATION GROQ:")
            print(f"Type d'erreur: {type(api_error).__name__}")
            print(f"Message: {str(api_error)}")
            print("Traceback complet:")
            traceback.print_exc()
            print("="*50)
            
            # En cas d'erreur pendant la génération d'idées
            fallback_response = session.generate_fallback_response()
            
            bot_msg = Message(conversation_id=conversation_id, content=fallback_response, is_bot=True)
            db.session.add(bot_msg)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': fallback_response,
                'conversationId': conversation_id,
                'clarification_complete': True,
                'warning': f'Réponse générée en mode de secours suite à une erreur: {type(api_error).__name__}'
            })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Route pour réinitialiser une session d'idéation (On ne supprime plus via ce bouton, mais via le DELETE en frontend)
@app.route('/api/chat/reset', methods=['POST'])
@jwt_required()
def reset_chat():
    try:
        # Simplification: l'utilisateur front demandera une nouvelle conversation,
        # donc on a juste besoin de ne rien faire ici sauf valider
        return jsonify({
            'success': True,
            'message': 'Veuillez utiliser start_chat ou envoyer un message sans ID pour démarrer une nouvelle conversation.'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)

        }), 500

# Ajouter les nouvelles routes pour l'export et l'envoi par email
@app.route('/api/mindmap/export', methods=['POST'])
@jwt_required()
def export_mindmap():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        format = data.get('format', 'markdown')
        content = data.get('content')
        
        if not content:
            return jsonify({'error': 'Aucun contenu à exporter'}), 400
            
        # Pour le format markdown, on renvoie directement le contenu
        if format == 'markdown':
            return jsonify({
                'success': True,
                'content': content,
                'format': format
            })
            
        # Pour le format HTML, on convertit le markdown en HTML
        elif format == 'html':
            html_content = markdown.markdown(content)
            styled_html = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
                    h1 {{ color: #2c3e50; }}
                    .section {{ margin: 20px 0; padding: 10px; border-left: 4px solid #3498db; }}
                    .emoji {{ font-size: 1.5em; }}
                </style>
            </head>
            <body>
                {html_content}
            </body>
            </html>
            """
            return jsonify({
                'success': True,
                'content': styled_html,
                'format': 'html'
            })
            
        if format == 'png':
            return send_file(
                content,
                mimetype='image/png',
                as_attachment=True,
                download_name='mindmap.png'
            )
            
        return jsonify({
            'success': True,
            'content': content,
            'format': format
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/mindmap/send-email', methods=['POST'])
@jwt_required()
def send_mindmap_email():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        to_email = data.get('email')
        format = data.get('format', 'html')
        
        if not to_email:
            return jsonify({'error': 'Email requis'}), 400
            
        if current_user_id not in ideation_sessions:
            return jsonify({'error': 'Session non trouvée'}), 404
            
        session = ideation_sessions[current_user_id]
        success = session.send_email(to_email, format)
        
        if not success:
            return jsonify({'error': 'Erreur lors de l\'envoi de l\'email'}), 500
            
        return jsonify({
            'success': True,
            'message': 'Email envoyé avec succès'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)