import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Hinglish translation endpoint
app.post("/api/translate-hinglish", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text to translate is required" });
    }

    const ai = getGeminiClient();
    const prompt = `Translate the following English passage into natural Indian Hinglish (conversational Hindi written in Roman script/English alphabet).

GUIDELINES:
1. Speak naturally as educated Indian speakers talk colloquially in day-to-day conversation.
2. DO NOT use formal, archaic, or Sanskritized Hindi words.
3. DO NOT use Devanagari script; use clear, standard Romanized Hindi (Hinglish).
4. DO NOT do robotic word-by-word translation; capture the true natural meaning and nuance effortlessly.
5. Example:
   English: "The old man walked slowly toward the village."
   Natural Hinglish: "Budha aadmi dheere-dheere gaon ki taraf gaya."

Passage to translate:
"${text.trim()}"

Provide ONLY the Hinglish translation, nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    const hinglish = response.text ? response.text.trim() : "";
    res.json({ original: text.trim(), hinglish });
  } catch (error: any) {
    console.error("Translation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate Hinglish translation",
    });
  }
});

// Vite middleware & static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BookReader server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
