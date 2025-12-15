import { GoogleGenAI, Type, Schema, FunctionDeclaration, LiveServerMessage, Modality } from "@google/genai";
import { JobGenerationResult, ModelMode } from "../types";

// Securely handle API Key: Prefer environment variable, fallback to provided key.
// WARNING: Hardcoding keys in frontend code is risky. Ensure this key is restricted in Google Cloud Console.
const API_KEY = process.env.API_KEY || "AIzaSyAKjJoup_KB7uEmPgMIHpc0nqMwQMKHVvc";

// Helper to get client with current key
const getClient = () => new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates Job Description and Interview Questions using Gemini 3 Pro with Thinking Mode.
 */
export const generateRecruitmentMaterials = async (
  rawNotes: string
): Promise<JobGenerationResult> => {
  const ai = getClient();
  
  const prompt = `
    You are an expert HR consultant. Based on the following raw notes, generate:
    1. A polished, professional Job Description formatted for LinkedIn (Markdown).
    2. An Interview Guide with 10 behavioral questions targeting skills in the JD.
    
    Raw Notes:
    ${rawNotes}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingBudget: 32768, 
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          jobDescription: {
            type: Type.STRING,
            description: "The full markdown formatted job description",
          },
          interviewQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 10 behavioral interview questions",
          },
        },
        required: ["jobDescription", "interviewQuestions"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response generated");
  
  return JSON.parse(text) as JobGenerationResult;
};

/**
 * AUTO-DETECT INTENT AND ROUTE TO CORRECT MODEL
 */
export const smartChatWithGemini = async (
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  location?: { lat: number; lng: number }
) => {
  const ai = getClient();

  // Step 1: Router - Classify Intent using Flash (Fastest)
  const routerPrompt = `
    Analyze this user message and classify it into one of these categories:
    - SIMPLE: Greetings, simple factual questions, short conversation.
    - COMPLEX: Reasoning tasks, coding, creative writing, complex explanations, interview prep.
    - SEARCH: Questions about current events, news, or specific realtime info.
    - MAPS: Questions about places, "near me", navigation, or geography requiring coordinates.

    User Message: "${message}"
    
    Return ONLY the category name.
  `;

  const routerResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: routerPrompt
  });

  const intent = routerResponse.text?.trim().toUpperCase() || 'COMPLEX'; 
  
  let modelName = 'gemini-3-pro-preview';
  let tools: any[] = [];
  let toolConfig: any = undefined;
  let modelLabel = 'Gemini 3 Pro (Thinking)';
  let thinkingConfig: any = undefined;
  let systemInstruction: string | undefined = undefined;

  // Step 2: Configure Model based on Intent
  switch (intent) {
    case 'SIMPLE':
      modelName = 'gemini-flash-lite-latest';
      modelLabel = 'Gemini Lite';
      break;
    
    case 'SEARCH':
      modelName = 'gemini-2.5-flash';
      modelLabel = 'Flash + Search';
      tools.push({ googleSearch: {} });
      break;

    case 'MAPS':
      modelName = 'gemini-2.5-flash';
      modelLabel = 'Flash + Maps';
      tools.push({ googleMaps: {} });
      if (location) {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng
            }
          }
        };
      }
      break;

    case 'COMPLEX':
    default:
      modelName = 'gemini-3-pro-preview';
      modelLabel = 'Gemini 3 Pro (Thinking)';
      thinkingConfig = { thinkingBudget: 2048 }; 
      // Instruct model to make thinking visible
      systemInstruction = "You are a helpful assistant. For this complex task, you must first output your step-by-step reasoning. Format this reasoning as a blockquote starting EXACTLY with '> **Thinking Process:**' followed by your thoughts. After the blockquote, provide the final answer clearly.";
      break;
  }

  // Step 3: Execute Chat
  const chat = ai.chats.create({
    model: modelName,
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    config: {
      tools: tools.length > 0 ? tools : undefined,
      toolConfig: toolConfig,
      thinkingConfig: thinkingConfig,
      systemInstruction: systemInstruction
    }
  });

  const response = await chat.sendMessage({ message });
  
  return {
    text: response.text,
    groundingMetadata: response.candidates?.[0]?.groundingMetadata,
    modelUsed: modelLabel
  };
};

// Kept for backward compatibility if needed, but smartChat replaces usage
export const chatWithGemini = async (
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  mode: ModelMode,
  location?: { lat: number; lng: number }
) => {
   return smartChatWithGemini(message, history, location);
};

/**
 * Real-time Job Search using Google Search Tool
 */
export const searchJobs = async (role: string, location: string) => {
  const ai = getClient();
  
  const prompt = `Find active job listings for "${role}" in or near "${location}". 
  List 5-7 specific job openings. 
  For each job, provide:
  1. Company Name
  2. Job Title
  3. A very brief summary (1 sentence)
  4. A 'Source' link if available from the search grounding.
  
  Format the output as a Markdown list. Make it look like a feed of opportunities.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  return {
    text: response.text,
    groundingMetadata: response.candidates?.[0]?.groundingMetadata
  };
};

/**
 * Veo Video Generation
 */
export const generateRecruitmentVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  imageBase64?: string
): Promise<string> => {
  const ai = getClient(); 
  
  let operation;
  const config = {
    numberOfVideos: 1,
    resolution: '720p', 
    aspectRatio: aspectRatio
  };

  if (imageBase64) {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: 'image/png' 
      },
      config
    });
  } else {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config
    });
  }

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); 
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error("Video generation failed to return a URI");

  // Append API Key to download link
  const videoRes = await fetch(`${uri}&key=${API_KEY}`);
  if (!videoRes.ok) throw new Error("Failed to download generated video");
  
  const blob = await videoRes.blob();
  return URL.createObjectURL(blob);
};

export const analyzeImage = async (
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    }
  });
  
  return response.text || "No analysis generated.";
};

export const analyzeVideo = async (
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    }
  });

  return response.text || "No analysis generated.";
};