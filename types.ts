export enum AppView {
  JOB_GENERATOR = 'JOB_GENERATOR',
  CHATBOT = 'CHATBOT',
  MEDIA_LAB = 'MEDIA_LAB',
  JOB_TRACKER = 'JOB_TRACKER'
}

export interface JobGenerationResult {
  jobDescription: string;
  interviewQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingMetadata?: any;
  modelUsed?: string; // e.g., "Gemini Lite", "Gemini Pro (Thinking)"
}

export interface GroundingSource {
  title?: string;
  uri?: string;
  sourceText?: string;
}

export enum ModelMode {
  STANDARD = 'STANDARD', // Gemini 3 Pro
  THINKING = 'THINKING', // Gemini 3 Pro + Thinking
  FAST = 'FAST', // Gemini 2.5 Flash Lite
  SEARCH = 'SEARCH', // Gemini 2.5 Flash + Search
  MAPS = 'MAPS' // Gemini 2.5 Flash + Maps
}