import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { UserProfile, MoveItem, ChatMessage } from "../../types";
import { MiniGamesHub } from "../MiniGames/MiniGamesHub";
import {
  Brain,
  Send,
  Sparkles,
  Loader2,
  Compass,
  User,
  Paperclip,
  Image as ImageIcon,
  X,
  BookOpen,
  Code2,
  HelpCircle,
  Gamepad2,
  CheckCircle2,
} from "lucide-react";

interface NavigatorScreenProps {
  userProfile: UserProfile;
  moves: MoveItem[];
}

interface AttachedImage {
  data: string; // base64
  mimeType: string;
  name: string;
  previewUrl: string;
}

export const NavigatorScreen: React.FC<NavigatorScreenProps> = ({
  userProfile,
  moves,
}) => {
  const preferredName = userProfile.preferredName || "Friend";
  const [navigatorSection, setNavigatorSection] = useState<"chat" | "games">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-greeting",
      role: "assistant",
      text: `Hello, ${preferredName}! I am NAVIGATOR — your official AI Assistant built directly into CRESCIVE.

I'm here to help you navigate the app, learn new topics, write and debug code, brainstorm, plan, and make better decisions.

Our guiding compass is **LEARN → GROW → CREATE → PROGRESS**.

Here are a few ways we can work together:
- **App Navigation:** Ask me where anything is located (like where to practice coding or find the games)
- **Learning & STEM:** Ask for step-by-step explanations, math problems, or study roadmaps
- **Coding & App Building:** Share code snippets or app ideas for architecture and debugging advice
- **Goals & Moves:** Turn vague ambitions into practical, discrete daily Moves
- **Multimodal Analysis:** Upload or drag-and-drop a screenshot or diagram for immediate feedback

How can I help you take your next step today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, attachedImage]);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (PNG, JPEG, WebP, GIF).");
      setTimeout(() => setUploadError(null), 4000);
      return;
    }
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawData = e.target?.result as string;
      if (!rawData) return;

      // Downscale image to max 1000px to maintain buttery performance on lower-end devices
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1000;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedData = canvas.toDataURL(file.type || "image/jpeg", 0.85);
            setAttachedImage({
              data: optimizedData,
              mimeType: file.type || "image/jpeg",
              name: file.name,
              previewUrl: optimizedData,
            });
            return;
          }
        } catch {
          // Fallback to raw data if canvas fails
        }

        setAttachedImage({
          data: rawData,
          mimeType: file.type,
          name: file.name,
          previewUrl: rawData,
        });
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSend = async (userText?: string) => {
    const textToSend = userText !== undefined ? userText : input;
    if ((!textToSend.trim() && !attachedImage) || loading) return;

    const currentImage = attachedImage;
    const displayText = textToSend.trim() || (currentImage ? "[Attached image]" : "");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: displayText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (userText === undefined) setInput("");
    setAttachedImage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/navigator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          userProfile,
          moves,
          recentHistory: messages.slice(-6),
          image: currentImage
            ? {
                data: currentImage.data,
                mimeType: currentImage.mimeType,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Navigator server error");
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text:
          data.reply ||
          `I am with you, ${preferredName}. Let's turn this into clear learning and practical next Moves!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: `I'm here with you, ${preferredName}.\n\nRemember our core principle: **LEARN → GROW → CREATE → PROGRESS**.\n\nWhether you're learning a concept, debugging code, or exploring the app, feel free to ask a specific question or head to the **Moves** tab to track your next step.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="navigator-assistant-view"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col h-[calc(100vh-140px)] max-h-[850px] pb-10 transition-colors ${
        isDragging ? "ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#080816] rounded-2xl" : ""
      }`}
    >
      {/* Hidden File Input for Drag-and-Drop / Click Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        id="navigator-file-input"
      />

      {/* Dragging Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#080816]/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-[#D4AF37] pointer-events-none">
          <ImageIcon className="w-12 h-12 text-[#D4AF37] mb-2 animate-bounce" />
          <p className="text-sm font-semibold text-white">Drop screenshot or image here</p>
          <p className="text-xs text-zinc-400 mt-1">Navigator will analyze and explain it for you</p>
        </div>
      )}

      {/* Navigator Header with Section Toggle */}
      <div className="p-3.5 sm:p-4 rounded-2xl crescive-glass border border-amber-300/20 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#FFF1C5] p-[1.5px] shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <div className="w-full h-full rounded-xl bg-[#0F1122] flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#F5D77F]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold font-display text-white tracking-wide">
                NAVIGATOR
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 font-medium border border-amber-400/20 hidden sm:inline-block">
                Official AI & Games
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Navigate, learn, code, plan, play 3D mini-games & progress.
            </p>
          </div>
        </div>

        {/* Section Switcher: AI Companion vs 3D Mini Games */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10 self-start sm:self-center">
          <button
            onClick={() => setNavigatorSection("chat")}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              navigatorSection === "chat"
                ? "bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                : "text-zinc-400 hover:text-white border border-transparent"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>AI Companion</span>
          </button>

          <button
            onClick={() => setNavigatorSection("games")}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              navigatorSection === "games"
                ? "bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                : "text-zinc-400 hover:text-white border border-transparent"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>3D Mini Games</span>
          </button>
        </div>
      </div>

      {/* Upload Error Banner */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2"
          >
            <span>{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              className="p-1 text-rose-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conditionally Render 3D Mini Games Hub OR AI Chat */}
      {navigatorSection === "games" ? (
        <div className="flex-1 overflow-y-auto px-1">
          <MiniGamesHub onBackToCompanion={() => setNavigatorSection("chat")} />
        </div>
      ) : (
        <>
          {/* Chat Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 px-1.5 sm:px-2 py-2">
        {messages.map((msg) => {
          const isAssistant = msg.role === "assistant";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 sm:gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
            >
              {isAssistant && (
                <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0 mt-1">
                  <Compass className="w-3.5 h-3.5 text-[#F5D77F]" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                  isAssistant
                    ? "crescive-glass border border-amber-300/20 text-zinc-100 shadow-[0_5px_20px_-5px_rgba(0,0,0,0.5)]"
                    : "bg-gradient-to-r from-amber-500/25 to-yellow-600/30 border border-[#D4AF37]/50 text-white"
                }`}
              >
                {isAssistant ? (
                  <div className="markdown-body text-zinc-200 leading-relaxed text-xs sm:text-sm [&>p]:mb-2.5 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-2.5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-2.5 [&>li]:mb-1 [&>h1]:text-base [&>h1]:font-bold [&>h1]:text-white [&>h1]:mb-2 [&>h2]:text-sm [&>h2]:font-bold [&>h2]:text-white [&>h2]:mb-1.5 [&>h3]:text-xs [&>h3]:font-bold [&>h3]:text-amber-200 [&>h3]:mb-1 [&>pre]:bg-black/40 [&>pre]:p-2.5 [&>pre]:rounded-xl [&>pre]:border [&>pre]:border-white/10 [&>pre]:my-2 [&>pre]:overflow-x-auto [&>code]:font-mono [&>code]:text-[11px] [&>code]:text-amber-200 [&>strong]:text-amber-200 [&>strong]:font-semibold">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-line text-xs sm:text-sm">{msg.text}</div>
                )}
                <div
                  className={`text-[9px] mt-2 font-mono ${
                    isAssistant ? "text-zinc-500" : "text-amber-200/60 text-right"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {!isAssistant && (
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-zinc-300" />
                </div>
              )}
            </motion.div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-amber-200/70 italic px-2 py-1">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-[#F5D77F] animate-spin" />
            </div>
            <span>Navigator is crafting a tailored, step-by-step response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { label: "🎮 Play 3D Mini Games", icon: Gamepad2, action: () => setNavigatorSection("games") },
          { label: "Where can I learn coding?", icon: Code2, action: () => handleSend("Where can I learn coding?") },
          { label: "What should I focus on today?", icon: CheckCircle2, action: () => handleSend("What should I focus on today?") },
          { label: "Help me build a study plan", icon: BookOpen, action: () => handleSend("Help me build a study plan") },
          { label: "How do I turn an idea into Moves?", icon: HelpCircle, action: () => handleSend("How do I turn an idea into Moves?") },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            disabled={loading}
            className="text-[11px] py-1 px-2.5 sm:px-3 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:border-amber-400/40 hover:text-amber-200 transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <item.icon className="w-3 h-3 text-[#D4AF37]" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Attached Image Preview */}
      <AnimatePresence>
        {attachedImage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-1.5 px-2 py-1.5 bg-black/40 border border-amber-300/30 rounded-xl flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={attachedImage.previewUrl}
                alt="Upload preview"
                className="w-10 h-10 object-cover rounded-lg border border-amber-400/30 shrink-0"
              />
              <div className="truncate text-xs text-zinc-300">
                <p className="font-medium text-amber-200 truncate">{attachedImage.name}</p>
                <p className="text-[10px] text-zinc-400">Ready for multimodal analysis</p>
              </div>
            </div>
            <button
              onClick={() => setAttachedImage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative mt-1"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl crescive-glass border border-amber-300/30">
          {/* Attachment button for screenshots / images */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach screenshot or image (drag & drop also supported)"
            disabled={loading}
            className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-amber-200 hover:bg-white/5 transition-all cursor-pointer shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              attachedImage
                ? "Ask a question about this screenshot/image..."
                : `Ask Navigator anything, ${preferredName}...`
            }
            disabled={loading}
            className="flex-1 bg-transparent px-2 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={(!input.trim() && !attachedImage) || loading}
            className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              (input.trim() || attachedImage) && !loading
                ? "gold-gradient-bg text-zinc-950 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110"
                : "bg-white/5 text-zinc-600 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
        </>
      )}
    </div>
  );
};

