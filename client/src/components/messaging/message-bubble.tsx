import React, { useState } from "react";
import { cn, getInitials } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { MessageSquarePlus, Smile, Settings, Pin, Bot, Megaphone, School, Paperclip } from "lucide-react";

export interface MessageProps {
    id: number | string;
    channelId: number;
    senderId: number | string;
    content: string;
    timestamp: string;
    senderName?: string;
    senderRole?: string;
    avatar?: string;
    read?: boolean;
    status?: 'sending' | 'sent' | 'error';
    attachment?: {
        url: string;
        type: 'image' | 'pdf' | 'other';
        name: string;
        isHomework?: boolean;
    };
    readBy?: number[];
}

interface MessageBubbleProps {
    msg: MessageProps;
    isOwn: boolean;
    isAI: boolean;
    isTeacherAnnouncement: boolean;
    showHeader: boolean;
    formatTime: string;
    formatDate: string;
    isTeacherStatus: boolean; // if current user is teacher
    onReply: (msg: MessageProps) => void;
    onDoubleTap: () => void;
}

export function MessageBubble({
    msg,
    isOwn,
    isAI,
    isTeacherAnnouncement,
    showHeader,
    formatTime,
    formatDate,
    isTeacherStatus,
    onReply,
    onDoubleTap
}: MessageBubbleProps) {
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    onTouchEnd={onDoubleTap}
                    className={cn(
                        "group flex gap-3 px-4 transition-colors duration-100 relative w-full",
                        showHeader ? "pt-4 pb-1" : "pt-1 pb-1",
                        isTeacherAnnouncement && "bg-[#FFF9E6]/50 hover:bg-[#FFF9E6]/80",
                        isOwn ? "flex-row-reverse" : "flex-row"
                    )}
                >
                    {/* Quick action bar on hover */}
                    <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white border border-gray-200 rounded-md p-1 shadow-sm z-10 transition-opacity",
                        isOwn ? "left-16" : "right-16"
                    )}>
                        <button
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition-colors"
                            onClick={() => onReply(msg)}
                            title="Reply"
                        >
                            <MessageSquarePlus className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#4F6BED] transition-colors" title="React">
                            <Smile className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Avatar column */}
                    {!isOwn && (
                        <div className={cn("flex flex-col items-center", showHeader ? "mt-0.5" : "opacity-0")}>
                            {showHeader && (
                                <Avatar className={cn("h-8 w-8 rounded-full shrink-0", isAI && "ring-2 ring-[#4F6BED]/40")}>
                                    {msg.avatar && <AvatarImage src={msg.avatar} />}
                                    <AvatarFallback className={cn(
                                        "text-white text-xs font-bold rounded-full",
                                        isAI ? "bg-[#4F6BED]" : "bg-gradient-to-br from-[#4F6BED] to-[#7c3aed]"
                                    )}>
                                        {isAI ? <Bot className="h-4 w-4" /> : getInitials(msg.senderName || "U")}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    )}

                    {/* Message content column */}
                    <div className={cn("flex flex-col min-w-0 max-w-[75%]", isOwn ? "items-end" : "items-start")}>
                        {showHeader && (
                            <div className={cn("flex items-baseline gap-2 mb-1", isOwn ? "flex-row-reverse" : "flex-row")}>
                                <span className={cn(
                                    "font-semibold text-[13px] leading-none cursor-pointer hover:underline",
                                    msg.senderRole === "teacher" ? "text-amber-600" : (isAI ? "text-[#4F6BED]" : "text-gray-700")
                                )}>
                                    {msg.senderName}
                                </span>
                                {isAI && (
                                    <span className="text-[9px] font-bold bg-[#4F6BED] text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                        AI
                                    </span>
                                )}
                                <span className="text-[11px] text-gray-400 font-normal">{formatDate} {formatTime}</span>
                            </div>
                        )}

                        {isTeacherAnnouncement && showHeader && (
                            <div className="flex items-center gap-1.5 mb-1.5 text-amber-600 text-[10px] font-bold uppercase tracking-wider bg-amber-100 w-fit px-2 py-0.5 rounded-sm">
                                <Megaphone className="h-3 w-3" /> Announcement
                            </div>
                        )}

                        <div className={cn(
                            "text-[15px] leading-relaxed break-words px-4 py-2 rounded-2xl relative shadow-sm",
                            isOwn ? "bg-[#4F6BED] text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                        )}>
                            <div className={cn("prose prose-sm max-w-none", isOwn ? "prose-invert" : "")}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        p: ({ node, ...props }) => <p className="m-0" {...props} />,
                                        a: ({ node, ...props }) => <a className="underline font-medium opacity-90 hover:opacity-100" target="_blank" rel="noopener noreferrer" {...props} />,
                                        code: ({ node, inline, ...props }: any) => (
                                            inline ? (
                                                <code className={cn("px-1 py-0.5 rounded text-[13px] font-mono", isOwn ? "bg-black/20" : "bg-gray-100 text-gray-800")} {...props} />
                                            ) : (
                                                <div className={cn("p-3 rounded-md overflow-x-auto my-2 border", isOwn ? "bg-black/20 border-white/10" : "bg-gray-50 border-gray-200")}>
                                                    <code className="text-[13px] font-mono" {...props} />
                                                </div>
                                            )
                                        )
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>

                            {msg.attachment && (
                                <div className={cn(
                                    "mt-2 p-3 rounded-md border max-w-sm",
                                    msg.attachment.isHomework
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                                        : (isOwn ? "bg-black/10 border-white/20" : "bg-gray-50 border-gray-200")
                                )}>
                                    {msg.attachment.isHomework && (
                                        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider">
                                            <School className="h-3 w-3" /> Homework Submission
                                        </div>
                                    )}
                                    {msg.attachment.type === 'image' ? (
                                        <img src={msg.attachment.url} alt={msg.attachment.name} className="w-full h-auto rounded border border-black/10" />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded", isOwn ? "bg-black/20" : "bg-gray-200")}>
                                                <Paperclip className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm truncate">{msg.attachment.name}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Self timestamp or status indicator in bubble */}
                            <div className={cn("flex justify-end items-center gap-1 mt-1 opacity-70", isOwn ? "text-white" : "text-gray-500")}>
                                <span className="text-[10px]">{formatTime}</span>
                                {isOwn && (
                                    <span className="text-[10px]">
                                        {msg.status === 'sending' ? '⏳' : msg.status === 'error' ? '❌' : '✓'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </ContextMenuTrigger>

            {/* Context Menu */}
            <ContextMenuContent className="w-52 bg-white border-gray-200 text-gray-800 shadow-xl rounded-md z-50">
                <ContextMenuItem onClick={() => onReply(msg)} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 py-2 rounded-sm">
                    <MessageSquarePlus className="mr-2 h-4 w-4 text-gray-500" /> Reply
                </ContextMenuItem>
                <ContextMenuItem className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 py-2 rounded-sm">
                    <Smile className="mr-2 h-4 w-4 text-gray-500" /> Add Reaction
                </ContextMenuItem>
                {isOwn && (
                    <ContextMenuItem className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 py-2 rounded-sm">
                        <Settings className="mr-2 h-4 w-4 text-gray-500" /> Edit Message
                    </ContextMenuItem>
                )}
                {isTeacherStatus && (
                    <ContextMenuItem className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 py-2 rounded-sm">
                        <Pin className="mr-2 h-4 w-4 text-amber-500" /> Pin Message
                    </ContextMenuItem>
                )}
                <ContextMenuSeparator className="bg-gray-100 my-1" />
                {(isOwn || isTeacherStatus) ? (
                    <ContextMenuItem className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 focus:text-red-600 py-2 rounded-sm">
                        Delete Message
                    </ContextMenuItem>
                ) : (
                    <ContextMenuItem className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 focus:text-red-600 py-2 rounded-sm">
                        Report Message
                    </ContextMenuItem>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
}
