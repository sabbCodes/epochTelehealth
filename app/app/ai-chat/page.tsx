"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Loader2,
  Brain,
  Stethoscope,
  ArrowLeft,
  Sparkles,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#004DFF]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#004DFF] rounded-2xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  AI Health Assistant
                </h1>
                <p className="text-xs text-slate-400">
                  Powered by your health data
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Online</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
        {/* Chat Container */}
        <div className="h-[calc(100vh-160px)] flex flex-col bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800/50 shadow-2xl overflow-hidden">
          {/* Chat Sub-header */}
          <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#004DFF]" />
                <span className="text-sm font-semibold text-white">AI Diagnostic Chat</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Trained on your health records</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
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
                    className={`flex items-start gap-3 max-w-[80%] ${
                      message.type === "user"
                        ? "flex-row-reverse"
                        : ""
                    }`}
                  >
                    <Avatar
                      className={`w-8 h-8 shrink-0 ${
                        message.type === "ai"
                          ? "bg-[#004DFF]"
                          : "bg-slate-700"
                      }`}
                    >
                      <AvatarFallback className="text-white bg-transparent">
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
                          ? "bubble-sent text-slate-100"
                          : "bubble-received text-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={`text-[10px] mt-2 ${
                          message.type === "user"
                            ? "text-slate-400"
                            : "text-slate-500"
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
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 bg-[#004DFF]">
                    <AvatarFallback className="text-white bg-transparent">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#004DFF]" />
                      <span className="text-sm text-slate-400">
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
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-slate-700/50 text-slate-300 hover:bg-[#004DFF]/10 hover:border-[#004DFF]/30 hover:text-white transition-all duration-200"
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </motion.div>
              )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-800/50 p-4 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Describe your symptoms or ask about your health..."
                  className="pr-12 bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl h-11 focus:ring-2 focus:ring-[#004DFF]/30 focus:border-[#004DFF]/50 transition-all"
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
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-[#004DFF] hover:bg-blue-600 rounded-lg disabled:opacity-30"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center mt-3 text-[10px] text-slate-500">
              <Shield className="w-3 h-3 mr-1.5 text-slate-600" />
              <span>
                AI responses are for informational purposes. Always consult
                healthcare professionals for medical advice.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
