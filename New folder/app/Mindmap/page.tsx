'use client';
import { useEffect, useState, useRef } from 'react';
import { Brain } from 'lucide-react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { INode } from 'markmap-common';

const transformer = new Transformer();

type MindmapData = {
  messages: Array<{
    content: string;
    isBot: boolean;
  }>;
  timestamp: string;
};

const MindmapPage = () => {
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'html' | 'png'>('markdown');

  useEffect(() => {
    const data = localStorage.getItem('mindmapData');
    if (data) {
      const parsedData = JSON.parse(data) as MindmapData;
      setMindmapData(parsedData);
    }
  }, []);

  useEffect(() => {
    if (!mindmapData || !svgRef.current) return;

    // Cleanup any existing mindmap
    if (markmapRef.current) {
      markmapRef.current.destroy();
      markmapRef.current = null;
    }

    // Clear the SVG content
    if (svgRef.current) {
      svgRef.current.innerHTML = '';
    }

    try {
      // Créer la mindmap à partir des données du bot
      const lastBotMessage = mindmapData.messages[mindmapData.messages.length - 1];
      if (lastBotMessage) {
        const markdown = generateMarkdownFromMessage(lastBotMessage.content);
        const { root } = transformer.transform(markdown);

        markmapRef.current = Markmap.create(svgRef.current, {
          autoFit: true,
          color: (node: INode) => {
            const colors = ['#7c3aed', '#4f46e5', '#06b6d4', '#0ea5e9', '#6366f1'];
            const level = (node.payload as any)?.depth || 0;
            return colors[level % colors.length];
          },
        }, root);
      }
    } catch (error) {
      console.error('Error creating mindmap:', error);
    }

    // Cleanup function
    return () => {
      if (markmapRef.current) {
        markmapRef.current.destroy();
        markmapRef.current = null;
      }
    };
  }, [mindmapData]);

  const generateMarkdownFromMessage = (content: string): string => {
    const sections = content.split('\n');
    let markdown = '# 🌟 Stratégie Globale\n\n';

    let currentSection = '';

    for (const line of sections) {
      const trimmedLine = line.trim();
      // On retire les astérisques pour nettoyer le noeud Markmap
      const cleanLine = trimmedLine.replace(/\*\*/g, '').replace(/\*/g, '');

      if (!cleanLine) continue;

      // Détection des sections principales
      if (cleanLine.includes('🎯 REFORMULATION') || cleanLine.includes('Objectif Principal') || cleanLine.includes('Défi')) {
        currentSection = 'challenge';
        markdown += '## 🎯 Objectif Principal\n';
      } else if (cleanLine.includes('🔍 ANALYSE') || cleanLine.includes('Contextuelle')) {
        currentSection = 'analysis';
        markdown += '## 🔍 Analyse Contextuelle\n';
      } else if (cleanLine.includes('💡 GÉNÉRATION') || cleanLine.includes('Idées')) {
        currentSection = 'ideas';
        markdown += '## 💡 Idées Innovantes\n';
      } else if (cleanLine.includes('⭐ TOP 3') || cleanLine.includes('RECOMMANDATIONS')) {
        currentSection = 'top3';
        markdown += '## ⭐ Top 3 Recommandations\n';
      } else if (cleanLine.includes('🚀 CONCEPT') || cleanLine.includes('PRINCIPAL')) {
        currentSection = 'concept';
        markdown += '## 🚀 Concept Principal\n';
      }
      // Si on est dans aucune section, on continue
      else if (currentSection === '') {
        continue;
      }
      // Traitement des données par section
      else {
        if (currentSection === 'challenge' && !cleanLine.includes('🎯')) {
          markdown += `### ${cleanLine}\n`;
        }

        else if (currentSection === 'analysis') {
          if (cleanLine.includes('Besoins') || cleanLine.includes('profonds')) {
            markdown += '### 🎯 Besoins\n';
          } else if (cleanLine.includes('Tendances') || cleanLine.includes('marché')) {
            markdown += '### 📈 Tendances\n';
          } else if (cleanLine.includes('Opportunités')) {
            markdown += '### ✨ Opportunités\n';
          } else if (cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('▶')) {
            const content = cleanLine.substring(1).trim();
            // On peut découper si ça contient ":"
            if (content.includes(':')) {
              const [titre, ...desc] = content.split(':');
              markdown += `- **${titre.trim()}**\n  - ${desc.join(':').trim()}\n`;
            } else {
              markdown += `- ${content}\n`;
            }
          } else {
            markdown += `- ${cleanLine}\n`;
          }
        }

        else if (currentSection === 'ideas') {
          // Détection "1️⃣ Nom :" ou "1. Nom :"
          const match = cleanLine.match(/^(\d️⃣|\d\.)\s*(.*?)\s*:\s*(.*)/);
          if (match) {
            const [_, num, name, desc] = match;
            markdown += `### 💡 ${name.trim()}\n- ${desc.trim()}\n`;
          } else if (cleanLine.match(/^(\d️⃣|\d\.)\s*(.*)/)) {
            // Pas de description séparée par ":"
            const textContent = cleanLine.replace(/^(\d️⃣|\d\.)\s*/, '');
            markdown += `### 💡 ${textContent}\n`;
          }
        }

        else if (currentSection === 'top3') {
          const match = cleanLine.match(/^(🥇|🥈|🥉|\d\.)\s*(.*?)\s*:\s*(.*)/);
          if (match) {
            const [_, medal, name, desc] = match;
            markdown += `### ${medal} ${name.trim()}\n- ${desc.trim()}\n`;
          }
        }

        else if (currentSection === 'concept') {
          if (cleanLine.toLowerCase().startsWith('nom :') || cleanLine.toLowerCase().startsWith('▶▶ nom')) {
            const name = cleanLine.split(':')[1]?.trim() || cleanLine;
            markdown += `### 📌 ${name}\n`;
          } else if (cleanLine.toLowerCase().startsWith('description') || cleanLine.toLowerCase().startsWith('▶▶ description')) {
            const desc = cleanLine.split(':')[1]?.trim() || cleanLine;
            markdown += `- 📝 **Description**\n  - ${desc}\n`;
          } else if (cleanLine.toLowerCase().includes('avantages') || cleanLine.toLowerCase().includes('points forts')) {
            markdown += `- ⭐ **Avantages Clés**\n`;
          } else if (cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('▶')) {
            markdown += `  - ${cleanLine.substring(1).trim()}\n`;
          }
        }
      }
    }

    return markdown;
  };  // Fonction pour exporter la mindmap
  const handleExport = async () => {
    try {
      if (!mindmapData?.messages.length) {
        alert('Aucune donnée à exporter');
        return;
      }

      const lastBotMessage = mindmapData.messages[mindmapData.messages.length - 1];
      const markdown = generateMarkdownFromMessage(lastBotMessage.content);

      if (exportFormat === 'png') {
        // Pour le format PNG, on exporte directement le SVG visible
        if (!svgRef.current) {
          throw new Error('Le SVG n\'est pas disponible');
        }

        // Créer une copie du SVG pour la manipulation
        const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
        const svgData = new XMLSerializer().serializeToString(svgClone);

        // Créer un canvas pour convertir le SVG en PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        // Définir la taille du canvas
        canvas.width = svgRef.current.clientWidth;
        canvas.height = svgRef.current.clientHeight;

        // Convertir le SVG en PNG
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mindmap.png';
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }
            }, 'image/png');
          }
        };
        img.src = url;
        return;
      }

      // Pour les autres formats, on envoie au backend
      const response = await fetch('http://localhost:5000/api/mindmap/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          format: exportFormat,
          content: markdown
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de l\'export');
      }

      // Pour les formats markdown et HTML
      const content = exportFormat === 'html' ? data.content : markdown;
      const type = exportFormat === 'html' ? 'text/html' : 'text/markdown';
      const extension = exportFormat === 'html' ? 'html' : 'md';

      const blob = new Blob([content], { type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindmap.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Fonction pour envoyer par email via Gmail
  const handleSendEmail = () => {
    if (!mindmapData?.messages.length) {
      alert('Aucune donnée à envoyer');
      return;
    }

    const lastBotMessage = mindmapData.messages[mindmapData.messages.length - 1];
    const markdown = generateMarkdownFromMessage(lastBotMessage.content);

    // Créer le corps du mail avec le contenu formaté
    const mailBody = encodeURIComponent(markdown);
    const mailSubject = encodeURIComponent("Mindmap d'idéation");

    // Ouvrir Gmail avec le message pré-rempli
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${mailSubject}&body=${mailBody}`,
      '_blank'
    );
  };

  // Fonction pour générer et télécharger le PNG puis ouvrir Gmail pour l'envoi
  const handleSendPngByGmail = async () => {
    if (!svgRef.current) {
      alert('Mindmap non générée');
      return;
    }
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svg.clientWidth || 1200;
      canvas.height = svg.clientHeight || 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            // 1. Télécharger automatiquement le PNG
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'mindmap.png';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            // 2. Ouvrir Gmail avec le sujet et le corps pré-remplis
            setTimeout(() => {
              const subject = encodeURIComponent("Mindmap d'idéation (PNG)");
              const body = encodeURIComponent("Votre mindmap PNG a été téléchargée. Veuillez l'ajouter en pièce jointe à ce mail.");
              window.open(
                `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`,
                '_blank'
              );
            }, 300);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (!mindmapData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="p-8 text-center shadow-xl rounded-2xl bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-800">Aucune mindmap disponible</h1>
          <p className="text-gray-600">Veuillez d&apos;abord générer des idées dans le chatbot.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
              Mindmap des Idées
            </h1>
            <p className="text-gray-600">Visualisation de vos idées générées</p>
          </div>
          <div className="flex flex-row gap-2">
            <button
              onClick={() => window.location.href = '/Chatbot'}
              className="px-4 py-2 text-purple-600 transition-all duration-200 border border-purple-200 rounded-xl hover:bg-purple-50"
            >
              Retour au chat
            </button>
            <button
              onClick={() => {
                if (!mindmapData?.messages.length) {
                  alert('Aucune réponse à envoyer');
                  return;
                }
                const lastBotMessage = mindmapData.messages[mindmapData.messages.length - 1];
                const subject = encodeURIComponent("Réponse IdeazBot");
                const body = encodeURIComponent(lastBotMessage.content);
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`, '_blank');
              }}
              className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700"
            >
              Envoyer le chat par mail
            </button>
          </div>
        </div>

        <div className="p-8 overflow-hidden shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl" style={{ height: 'calc(100vh - 200px)' }}>
          <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* Boutons d'export et d'envoi par email */}
      <div className="fixed flex space-x-4 bottom-4 right-4">
        <button
          onClick={async () => {
            if (!svgRef.current) {
              alert('Mindmap non générée');
              return;
            }
            const svg = svgRef.current;
            // Récupérer la taille réelle du SVG (fallback si non défini)
            let width = 1200;
            let height = 800;
            if (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width && svg.viewBox.baseVal.height) {
              width = svg.viewBox.baseVal.width;
              height = svg.viewBox.baseVal.height;
            } else if (svg.width && svg.height) {
              width = typeof svg.width === 'number' ? svg.width : parseInt(svg.width.baseVal.value || svg.width);
              height = typeof svg.height === 'number' ? svg.height : parseInt(svg.height.baseVal.value || svg.height);
            } else if (svg.clientWidth && svg.clientHeight) {
              width = svg.clientWidth;
              height = svg.clientHeight;
            }
            // Convertir le SVG en base64 de façon robuste
            const serializer = new XMLSerializer();
            let svgString = serializer.serializeToString(svg);
            // Corriger les caractères spéciaux pour base64
            svgString = svgString.replace(/\uFEFF/g, '');
            const svgBase64 = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                  if (blob) {
                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = 'mindmap.png';
                    document.body.appendChild(a);
                    a.click();
                    URL.revokeObjectURL(downloadUrl);
                    document.body.removeChild(a);
                  } else {
                    alert('Erreur lors de la génération du PNG.');
                  }
                }, 'image/png');
              } else {
                alert('Impossible de créer le contexte du canvas.');
              }
            };
            img.onerror = () => {
              alert('Erreur lors du rendu de l\'image.');
            };
            img.src = svgBase64;
          }}
          className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          Télécharger l'image
        </button>
      </div>
    </div>
  );
};

export default MindmapPage;
