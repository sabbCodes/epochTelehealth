"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Loader2,
  Heart,
  Brain,
  Stethoscope,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hello! I'm your AI Health Assistant. I can help you understand symptoms, provide health insights based on your medical records, and guide you on when to seek professional care. What health concerns would you like to discuss today?",
      timestamp: new Date(),
      suggestions: [
        "I have a headache and feel tired",
        "What do my recent lab results mean?",
        "I'm experiencing chest pain",
        "Help me understand my medication",
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: getAIResponse(message),
        timestamp: new Date(),
        suggestions: getFollowUpSuggestions(message),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("headache") || lowerMessage.includes("tired")) {
      return "Based on your symptoms of headache and fatigue, this could be related to several factors including dehydration, stress, lack of sleep, or tension. I notice from your health records that you've had similar episodes before. Here are some recommendations:\n\n• Stay hydrated (8-10 glasses of water daily)\n• Ensure adequate sleep (7-9 hours)\n• Consider stress management techniques\n• Monitor if symptoms persist beyond 24-48 hours\n\n⚠️ Seek immediate medical attention if you experience severe headache, vision changes, or neck stiffness.";
    }

    if (lowerMessage.includes("chest pain")) {
      return "⚠️ **IMPORTANT**: Chest pain can be serious and requires immediate attention. Please consider the following:\n\n**Seek Emergency Care Immediately if you have:**\n• Severe, crushing chest pain\n• Pain radiating to arm, jaw, or back\n• Shortness of breath\n• Sweating or nausea\n• Dizziness\n\n**For mild discomfort:**\n• It could be related to muscle strain, acid reflux, or anxiety\n• Monitor symptoms closely\n• Contact your healthcare provider\n\nBased on your health history, I recommend consulting with Dr. Adaora Okafor (your cardiologist) as soon as possible.";
    }

    if (
      lowerMessage.includes("lab results") ||
      lowerMessage.includes("results")
    ) {
      return "I can help you understand your recent lab results! From your latest blood work 2 days ago:\n\n**Key Findings:**\n• Cholesterol levels: Within normal range (Total: 185 mg/dL)\n• Blood glucose: Slightly elevated (110 mg/dL) - consider dietary adjustments\n• Vitamin D: Low (22 ng/mL) - supplementation recommended\n• Complete Blood Count: Normal\n\n**Recommendations:**\n• Continue heart-healthy diet\n• Consider Vitamin D3 supplement (2000 IU daily)\n• Follow up with Dr. Okafor in 3 months\n\nWould you like me to explain any specific values in more detail?";
    }

    return "Thank you for sharing that with me. Based on your health profile and medical history, I'd recommend discussing this with your healthcare provider for a proper evaluation. In the meantime, I can help you understand your symptoms better or guide you on when to seek care. Is there anything specific about your symptoms you'd like me to explain?";
  };

  const getFollowUpSuggestions = (userMessage: string): string[] => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("headache")) {
      return [
        "What triggers usually cause my headaches?",
        "Should I be concerned about frequency?",
        "What medications are safe for me?",
      ];
    }

    if (lowerMessage.includes("chest pain")) {
      return [
        "Book urgent appointment with cardiologist",
        "What are warning signs to watch for?",
        "Review my heart health history",
      ];
    }

    return [
      "Tell me more about my health trends",
      "What should I monitor going forward?",
      "Schedule follow-up appointment",
    ];
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI Health Assistant
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Powered by your health data
                </p>
              </div>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Online
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Chat Container */}
        <Card className="h-[calc(100vh-200px)] flex flex-col shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          {/* Chat Header */}
          <CardHeader className="border-b bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>AI Diagnostic Chat</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Stethoscope className="w-4 h-4" />
                <span>Trained on your health records</span>
              </div>
            </CardTitle>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start space-x-3 max-w-[80%] ${
                      message.type === "user"
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    }`}
                  >
                    <Avatar
                      className={`w-8 h-8 ${
                        message.type === "ai"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : "bg-blue-500"
                      }`}
                    >
                      <AvatarFallback className="text-white">
                        {message.type === "ai" ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.type === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          message.type === "user"
                            ? "text-blue-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500">
                    <AvatarFallback className="text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        AI is analyzing...
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Suggestions */}
            {messages.length > 0 &&
              messages[messages.length - 1].suggestions &&
              !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 justify-start ml-11"
                >
                  {messages[messages.length - 1].suggestions?.map(
                    (suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs bg-white/50 hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800"
                      >
                        {suggestion}
                      </Button>
                    )
                  )}
                </motion.div>
              )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t p-4 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Describe your symptoms or ask about your health..."
                  className="pr-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputMessage);
                    }
                  }}
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-1 top-1 h-8 w-8 p-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center mt-3 text-xs text-gray-500 dark:text-gray-400">
              <Heart className="w-3 h-3 mr-1 text-red-500" />
              <span>
                AI responses are for informational purposes. Always consult
                healthcare professionals for medical advice.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
