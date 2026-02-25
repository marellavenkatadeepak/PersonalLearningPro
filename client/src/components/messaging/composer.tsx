import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, Smile, Mic, Plus, Paperclip, Sparkles } from "lucide-react";

interface ComposerProps {
    inputValue: string;
    setInputValue: (val: string) => void;
    handleSendMessage: (e?: React.FormEvent) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    handleFileAttach: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    activeChannel: any;
    currentUser: any;
    replyingToMessage: any | null;
    setReplyingToMessage: (msg: any | null) => void;
    pendingAttachment: any;
    setPendingAttachment: (att: any) => void;
    typingUsers: Record<number, any>;
    handleTyping: () => void;
    onAskAITutor?: () => void;
}

export function Composer({
    inputValue,
    setInputValue,
    handleSendMessage,
    handleKeyDown,
    handleFileAttach,
    fileInputRef,
    handleFileChange,
    activeChannel,
    currentUser,
    replyingToMessage,
    setReplyingToMessage,
    pendingAttachment,
    setPendingAttachment,
    typingUsers,
    handleTyping,
    onAskAITutor
}: ComposerProps) {
    const isAnnouncement = activeChannel?.type === 'announcement';
    const isTeacher = currentUser?.profile?.role === 'teacher';
    const isDisabled = isAnnouncement && !isTeacher;

    return (
        <div className="px-4 pb-6 pt-2 bg-[#F5F7FB] shrink-0 w-full max-w-4xl mx-auto">
            {/* Typing Indicator */}
            <AnimatePresence>
                {Object.keys(typingUsers).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-[12px] text-gray-500 mb-2 px-1"
                    >
                        <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                        </div>
                        {Object.values(typingUsers).length === 1
                            ? `${Object.values(typingUsers)[0].username} is typing...`
                            : `${Object.values(typingUsers).length} people are typing...`}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reply Banner */}
            {replyingToMessage && (
                <div className="bg-white border border-gray-200 border-b-0 rounded-t-xl px-4 py-2 flex items-center justify-between -mb-1 relative z-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <MessageSquarePlus className="h-4 w-4 text-[#4F6BED] shrink-0" />
                        <span className="text-[12px] text-[#4F6BED] font-semibold shrink-0">
                            Replying to {replyingToMessage.senderName}
                        </span>
                        <span className="text-[12px] text-gray-500 truncate">{replyingToMessage.content}</span>
                    </div>
                    <button onClick={() => setReplyingToMessage(null)} className="text-gray-400 hover:text-gray-600 ml-2">
                        ×
                    </button>
                </div>
            )}

            {/* Pending attachment */}
            {pendingAttachment && (
                <div className="bg-white border border-gray-200 border-b-0 rounded-t-xl p-3 flex items-center gap-3 -mb-1 relative z-0">
                    <button
                        onClick={() => setPendingAttachment(null)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-sm"
                    >×</button>
                    {pendingAttachment.type === 'image' ? (
                        <img src={pendingAttachment.previewUrl} className="h-14 w-14 rounded object-cover border border-gray-200" />
                    ) : (
                        <div className="h-14 w-14 bg-gray-50 rounded flex items-center justify-center border border-gray-200">
                            <Paperclip className="h-5 w-5 text-gray-400" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate font-medium">{pendingAttachment.name}</p>
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                            <div className={cn("w-4 h-4 rounded border flex items-center justify-center",
                                pendingAttachment.isHomework ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"
                            )}>
                                {pendingAttachment.isHomework && <span className="text-white text-[10px]">✔</span>}
                            </div>
                            <span className="text-[12px] text-gray-500">Submit for grading</span>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={pendingAttachment.isHomework}
                                onChange={e => setPendingAttachment({ ...pendingAttachment, isHomework: e.target.checked })}
                            />
                        </label>
                    </div>
                </div>
            )}

            <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Main Input Bar */}
            <form
                onSubmit={handleSendMessage}
                className={cn(
                    "flex items-center bg-white rounded-full border border-gray-200 shadow-sm overflow-visible relative z-10 transition-shadow focus-within:ring-2 focus-within:ring-[#4F6BED]/20 focus-within:border-[#4F6BED]/30",
                    (replyingToMessage || pendingAttachment) && "rounded-t-none rounded-b-xl border-t-0 shadow-none focus-within:ring-0 focus-within:border-gray-200"
                )}
            >
                {/* Add file button */}
                <button
                    type="button"
                    onClick={handleFileAttach}
                    className="px-4 py-3 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    title="Attach file"
                >
                    <Plus className="h-5 w-5" />
                </button>

                {/* Text input */}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        handleTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        isDisabled
                            ? "Only teachers can post here"
                            : `Message #${activeChannel?.name}`
                    }
                    disabled={isDisabled}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-800 placeholder:text-gray-400 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {/* Right icons */}
                <div className="flex items-center gap-1.5 pr-2 pl-1">
                    {/* Ask AI Tutor */}
                    {!isDisabled && (
                        <button
                            type="button"
                            onClick={onAskAITutor}
                            className="text-[#4F6BED] hover:bg-[#4F6BED]/10 rounded-full p-2 transition-colors flex items-center gap-1 group"
                            title="Ask AI Tutor"
                        >
                            <Sparkles className="h-5 w-5 fill-[#4F6BED]/20" />
                            <span className="text-[13px] font-semibold pr-1 hidden sm:block group-hover:scale-105 transition-transform">Ask AI</span>
                        </button>
                    )}

                    <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 hidden sm:block" title="Voice message">
                        <Mic className="h-5 w-5" />
                    </button>
                    <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 hidden sm:block" title="Emoji">
                        <Smile className="h-5 w-5" />
                    </button>

                    <button
                        type="submit"
                        className="ml-1 bg-[#4F6BED] hover:bg-[#3A56D4] text-white rounded-full px-4 py-2 text-[14px] font-semibold transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center min-w-[70px]"
                        disabled={isDisabled || (!inputValue.trim() && !pendingAttachment)}
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}
