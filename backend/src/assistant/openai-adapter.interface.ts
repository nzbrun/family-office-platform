export interface OpenAIAdapter {
  chat: {
    completions: {
      create: (params: any) => Promise<any>;
    };
  };
}
