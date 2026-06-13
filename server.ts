import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import rateLimit from "express-rate-limit";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Admin for token verification
// Using only the projectId is sufficient for verifyIdToken to fetch public keys
if (!getApps().length) {
  initializeApp({ projectId: firebaseConfig.projectId });
}

// Rate Limiting: 10 requests per 15 minutes per IP
const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'invalid_key' });

  // Secure API Endpoint
  app.post("/api/chat", chatRateLimiter, async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: "La clé API Gemini n'est pas configurée. Veuillez l'ajouter dans les paramètres." });
        return;
      }
      
      // 1. Firebase Auth Validation
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         res.status(401).json({ error: 'Non autorisé: Token manquant' });
         return;
      }
      const idToken = authHeader.split('Bearer ')[1];
      try {
        await getAuth().verifyIdToken(idToken);
      } catch (err) {
         res.status(403).json({ error: 'Non autorisé: Token invalide' });
         return;
      }

      // 2. Structured Content Generation
      const { message, history } = req.body;
      
      const contents = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: "Tu es un guide touristique expert du Maroc. Réponds de façon précise concrète et utile avec des conseils pratiques. Garde tes réponses courtes et structurées."
        }
      });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error("AI Chat Error:", e);
      let errorMessage = 'Erreur lors de la communication avec l\'IA.';
      if (e.message) {
        try {
          const parsed = JSON.parse(e.message.replace(/^\[.*?\]\s*/, ''));
          if (parsed.error && parsed.error.message) {
             errorMessage = parsed.error.message;
          } else {
             errorMessage = e.message;
          }
        } catch {
          // If it's pure text but looks like JSON
          try {
             // For cases like: `[403 Forbidden] {"error": ...}`
             const match = e.message.match(/(\{.*\})/);
             if (match) {
                const parsed = JSON.parse(match[1]);
                if (parsed.error && parsed.error.message) {
                   errorMessage = parsed.error.message;
                }
             } else {
                errorMessage = e.message;
             }
          } catch {
             errorMessage = e.message;
          }
        }
      }
      
      // Translate common Gemini API errors into French
      if (errorMessage.includes('API key not valid') || errorMessage.includes('API Key not found')) {
        errorMessage = "La clé API configurée n'est pas valide.";
      } else if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('denied access')) {
        errorMessage = "L'accès à l'API est refusé avec cette clé. Veuillez vérifier vos accès et quotas.";
      }

      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
