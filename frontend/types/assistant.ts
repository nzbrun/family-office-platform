/**
 * Types for Assistant API
 */

export interface AssistantQueryRequest {
  message: string;
}

export interface AssistantQueryResponse {
  answer: string;
  actionsTaken: string[];
  citations: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionsTaken?: string[];
  citations?: string[];
  error?: string;
}
