'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiClient } from '@/lib/api';
import type { AssistantQueryRequest, AssistantQueryResponse, ChatMessage } from '@/types/assistant';

export default function AssistantPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add thinking message
    const thinkingMessage: ChatMessage = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      content: 'Thinking...',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, thinkingMessage]);

    try {
      const request: AssistantQueryRequest = {
        message: userMessage.content,
      };

      const response = await apiClient.post<AssistantQueryResponse>(
        '/assistant/query',
        request
      );

      // Remove thinking message and add response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== thinkingMessage.id);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: response.answer,
            actionsTaken: response.actionsTaken,
            citations: response.citations,
            timestamp: new Date(),
          },
        ];
      });
    } catch (error: unknown) {
      // Remove thinking message
      setMessages((prev) => prev.filter((msg) => msg.id !== thinkingMessage.id));

      let errorMessage = 'An error occurred';
      let errorType: 'error' | 'warning' = 'error';

      if (error instanceof Error) {
        const errorWithStatus = error as Error & {
          statusCode?: number;
          retryAfter?: number;
        };

        // Handle specific status codes
        if (errorWithStatus.statusCode === 429) {
          const retryAfter = errorWithStatus.retryAfter
            ? `Retry in ${errorWithStatus.retryAfter}s`
            : 'Retry in a few seconds';
          errorMessage = `Rate limit exceeded. ${retryAfter}.`;
          errorType = 'warning';
        } else if (errorWithStatus.statusCode === 504) {
          errorMessage = 'Request timeout. Please try again.';
          errorType = 'warning';
        } else if (errorWithStatus.statusCode === 501) {
          errorMessage = 'OpenAI is not configured. Please contact your administrator.';
          errorType = 'error';
        } else if (errorWithStatus.statusCode === 400) {
          const message = error.message.toLowerCase();
          if (message.includes('read-only') || message.includes('writing')) {
            errorMessage = 'Read-only: Writing actions are not allowed.';
          } else {
            errorMessage = error.message || 'Invalid request. Please check your message.';
          }
          errorType = 'warning';
        } else {
          errorMessage = error.message || 'Failed to get response from assistant';
        }
      }

      const errorChatMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage,
        error: errorType,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assistant</h1>
            <p className="text-gray-600">Ask questions about your portfolio</p>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" onClick={handleClearChat}>
              Clear Chat
            </Button>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 rounded-md border bg-white p-4 mb-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-lg font-medium mb-2">Start a conversation</p>
                  <p className="text-sm">
                    Ask questions like &quot;What is my portfolio worth?&quot; or
                    &quot;Show me assets without valuations&quot;
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.error === 'error'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : message.error === 'warning'
                              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                              : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.actionsTaken && message.actionsTaken.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <p className="text-xs font-semibold mb-1">Actions:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.actionsTaken.map((action, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <p className="text-xs font-semibold mb-1">Citations:</p>
                          <ul className="text-xs space-y-1">
                            {message.citations.map((citation, idx) => (
                              <li key={idx} className="list-disc list-inside">
                                {citation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your portfolio..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
