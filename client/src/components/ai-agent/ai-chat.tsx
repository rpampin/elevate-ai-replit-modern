import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Sparkles, User, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // Get suggested questions
  const { data: suggestionsData } = useQuery({
    queryKey: ["/api/ai-agent/suggestions"],
  });

  const suggestions = suggestionsData?.suggestions || [];

  // AI query mutation
  const queryMutation = useMutation({
    mutationFn: async (query: string) => {
      return apiRequest("POST", "/api/ai-agent/query", { query });
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: () => {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        type: 'ai',
        content: "I'm having trouble processing your question right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSubmit = (query: string) => {
    if (!query.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      type: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Clear input
    setInput("");

    // Send to AI
    queryMutation.mutate(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          AI Talent Assistant
        </CardTitle>
        <CardDescription>
          Ask questions about your team's skills, availability, and expertise
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Suggested Questions */}
        {messages.length === 0 && suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Sparkles className="w-4 h-4" />
              Try asking:
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 text-xs p-2"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 w-full">
          <div className="space-y-4 pr-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Ask me anything about your team's skills and availability!</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'ai' && (
                      <Bot className="w-4 h-4 mt-0.5 text-blue-600" />
                    )}
                    {message.type === 'user' && (
                      <User className="w-4 h-4 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {queryMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about skills, team members, availability..."
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit(input)}
            disabled={queryMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={() => handleSubmit(input)}
            disabled={!input.trim() || queryMutation.isPending}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}