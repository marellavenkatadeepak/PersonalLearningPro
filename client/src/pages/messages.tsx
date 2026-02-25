import { useState, useEffect, useRef } from "react";
import { useFirebaseAuth } from "@/contexts/firebase-auth-context";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { cn, getInitials } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import { MessagingHome } from "@/components/messaging/messaging-home";
import { ChannelSidebar } from "@/components/messaging/channel-sidebar";
import {
    MessageSquare,
    Hash,
    Volume2,
    Megaphone,
    Settings,
    Users,
    Send,
    Loader2,
    Menu,
    Paperclip,
    Smile,
    School,
    MessageSquarePlus,
    Search,
    Sparkles,
    Bot,
    Bell,
    Bookmark,
    Mic,
    Pin,
    Plus,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Types based on our schema
interface Channel {
    id: number;
    name: string;
    type: string;
    class: string | null;
    subject: string | null;
    unreadCount?: number;
    lastMessage?: string;
    pinnedMessage?: string;
}

interface Message {
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
    gradingStatus?: 'pending' | 'graded' | null;
}

interface Workspace {
    id: string;
    name: string;
    icon: React.ReactNode;
    isActive: boolean;
}

export default function Messages() {
    const { currentUser } = useFirebaseAuth();
    const [location, setLocation] = useLocation();
    const { toast } = useToast();

    const [channels, setChannels] = useState<Channel[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<number, { username: string, expires: number }>>({});
    const lastTypingTimeRef = useRef<number>(0);

    const AI_TUTOR_ID = 999;
    const AI_TUTOR_NAME = "AI Tutor";

    const [inputValue, setInputValue] = useState("");
    const [isLoadingChannels, setIsLoadingChannels] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
    const [pendingAttachment, setPendingAttachment] = useState<{
        file: File | null;
        previewUrl: string;
        type: 'image' | 'pdf' | 'other';
        name: string;
        isHomework: boolean;
        uploading: boolean;
        progress: number;
    } | null>(null);
    const [lastTapTime, setLastTapTime] = useState(0);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fallback to Grade 11-A for demo purposes if user class is absent
    const userClass = currentUser.profile?.classId || "Grade 11-A";

    // Active workspace name
    const activeWorkspaceName = workspaces.find(w => w.isActive)?.name || "School Server";

    // Fetch Workspaces and Channels on Component Mount
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser.profile?.uid) return;
            setIsLoadingChannels(true);
            try {
                const wsRes = await apiRequest("GET", "/api/workspaces");
                const wsData: any[] = await wsRes.json();
                setWorkspaces(wsData.map(w => ({
                    id: w.id.toString(),
                    name: w.name,
                    icon: <School className="h-5 w-5" />,
                    isActive: w.name === userClass
                })));

                const chRes = await apiRequest("GET", `/api/channels/query/${encodeURIComponent(userClass)}`);
                const chData: Channel[] = await chRes.json();
                setChannels(chData);
                if (chData.length > 0 && !activeChannel) setActiveChannel(chData[0]);
            } catch (error) {
                console.error("Failed to fetch messaging data:", error);
            } finally {
                setIsLoadingChannels(false);
            }
        };
        fetchData();
    }, [userClass, currentUser.profile?.uid]);

    // Fetch Messages when Active Channel changes
    useEffect(() => {
        if (!activeChannel) return;

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const res = await apiRequest("GET", `/api/messages/${activeChannel.id}`);
                const data = await res.json();
                const enrichedData = data.map((msg: any) => ({ ...msg, read: true, status: 'sent' }));
                setMessages(enrichedData);

                if (enrichedData.length > 0 && currentUser.profile?.uid) {
                    const lastMsg = enrichedData[enrichedData.length - 1];
                    const myId = parseInt(currentUser.profile.uid);
                    if (!lastMsg.readBy?.includes(myId)) {
                        apiRequest("POST", `/api/messages/${lastMsg.id}/read`);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [activeChannel, currentUser.profile?.uid]);

    // Offline detection
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Cleanup typing status
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setTypingUsers(prev => {
                const next = { ...prev };
                let changed = false;
                for (const uid in next) {
                    if (next[uid].expires < now) { delete next[uid]; changed = true; }
                }
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // WebSocket connection with reconnect
    useEffect(() => {
        let socket: WebSocket | null = null;
        let reconnectTimeout: any = null;
        let reconnectCount = 0;

        const connect = () => {
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const host = window.location.host;
            socket = new WebSocket(`${protocol}//${host}/ws/chat`);

            socket.onopen = () => {
                setWs(socket);
                reconnectCount = 0;
                if (activeChannel) {
                    socket?.send(JSON.stringify({ type: "join_channel", channelId: activeChannel.id }));
                }
            };

            socket.onmessage = (event) => {
                try {
                    const wsMessage = JSON.parse(event.data);
                    if (wsMessage.type === "new_message") {
                        const newMsg = wsMessage.message;
                        setChannels(prev => prev.map(c => {
                            if (c.id === newMsg.channelId) {
                                return {
                                    ...c,
                                    lastMessage: newMsg.content,
                                    unreadCount: (!activeChannel || activeChannel.id !== c.id) ? (c.unreadCount || 0) + 1 : 0
                                };
                            }
                            return c;
                        }));
                        setMessages(prev => {
                            if (activeChannel && newMsg.channelId === activeChannel.id) {
                                if (prev.some(m => m.id === newMsg.id)) return prev;
                                return [...prev, newMsg];
                            }
                            return prev;
                        });
                        if (activeChannel && newMsg.channelId === activeChannel.id && currentUser.profile?.uid) {
                            socket?.send(JSON.stringify({ type: "mark_read", messageId: newMsg.id, channelId: newMsg.channelId }));
                        }
                    } else if (wsMessage.type === "message_read") {
                        const { messageId, userId } = wsMessage;
                        setMessages(prev => prev.map(m => {
                            if (m.id === messageId) return { ...m, readBy: Array.from(new Set([...(m.readBy || []), userId])) };
                            return m;
                        }));
                    } else if (wsMessage.type === "user_typing") {
                        const { userId, username, channelId } = wsMessage;
                        if (activeChannel && channelId === activeChannel.id && userId !== parseInt(currentUser.profile?.uid || "0")) {
                            setTypingUsers(prev => ({ ...prev, [userId]: { username, expires: Date.now() + 3000 } }));
                        }
                    }
                } catch (e) {
                    console.error("Error parsing WS message:", e);
                }
            };

            socket.onclose = () => {
                setWs(null);
                const delay = Math.min(1000 * Math.pow(2, reconnectCount), 30000);
                reconnectTimeout = setTimeout(() => { reconnectCount++; connect(); }, delay);
            };

            socket.onerror = (err) => { console.error("WebSocket error:", err); socket?.close(); };
        };

        connect();
        return () => { socket?.close(); clearTimeout(reconnectTimeout); };
    }, [activeChannel, currentUser.profile?.uid]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!inputValue.trim() && !pendingAttachment) || !activeChannel || !currentUser.profile?.uid) return;

        if (pendingAttachment && !pendingAttachment.uploading) {
            setPendingAttachment(prev => prev ? { ...prev, uploading: true, progress: 0 } : null);
            try {
                const uploadRes = await apiRequest("POST", "/api/upload", {
                    name: pendingAttachment.name,
                    type: pendingAttachment.type,
                });
                const { url } = await uploadRes.json();
                setPendingAttachment(prev => prev ? { ...prev, previewUrl: url, uploading: false, progress: 100 } : null);
            } catch (error) {
                toast({ title: "Upload failed", variant: "destructive" });
                setPendingAttachment(prev => prev ? { ...prev, uploading: false } : null);
                return;
            }
        }

        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: Message = {
            id: tempId,
            channelId: activeChannel.id,
            senderId: currentUser.profile.uid,
            senderName: currentUser.profile.displayName || "Unknown User",
            senderRole: currentUser.profile.role || "student",
            content: inputValue.trim() || (pendingAttachment ? `Shared a file: ${pendingAttachment.name}` : ""),
            timestamp: new Date().toISOString(),
            status: 'sending',
            attachment: pendingAttachment ? {
                url: pendingAttachment.previewUrl,
                type: pendingAttachment.type,
                name: pendingAttachment.name,
                isHomework: pendingAttachment.isHomework
            } : undefined
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInputValue("");
        setReplyingToMessage(null);
        setPendingAttachment(null);

        try {
            const res = await apiRequest("POST", "/api/messages", {
                channelId: activeChannel.id,
                senderId: currentUser.profile.uid,
                senderName: currentUser.profile.displayName || "Unknown User",
                senderRole: currentUser.profile.role || "student",
                avatar: currentUser.profile.photoURL || null,
                content: optimisticMsg.content,
                attachment: optimisticMsg.attachment,
                replyToId: replyingToMessage?.id
            });
            const savedMsg = await res.json();
            setMessages(prev => prev.map(m => m.id === tempId ? { ...savedMsg, status: 'sent', read: false } : m));
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
    };

    const handleNewDM = async () => {
        const otherUserId = window.prompt("Enter User ID to start a DM:");
        if (!otherUserId || !currentUser.profile?.uid) return;
        try {
            const res = await apiRequest("POST", "/api/channels/dm", { userIds: [currentUser.profile.uid, otherUserId] });
            const newDm = await res.json();
            setChannels(prev => { if (prev.find(c => c.id === newDm.id)) return prev; return [...prev, newDm]; });
            setActiveChannel(newDm);
        } catch (error) { console.error("Failed to start DM:", error); }
    };

    const handleCreateChannel = async (name: string, type: "text" | "announcement", subject: string) => {
        if (!name.trim() || !currentUser.profile?.uid) return;
        const activeWs = workspaces.find(w => w.isActive);
        if (!activeWs) { toast({ title: "No active workspace found", variant: "destructive" }); return; }
        try {
            const res = await apiRequest("POST", "/api/channels", {
                name,
                type,
                workspaceId: parseInt(activeWs.id),
                class: userClass,
                subject
            });
            if (res.ok) {
                const newChannel = await res.json();
                setChannels(prev => [...prev, newChannel]);
                setActiveChannel(newChannel);
                toast({ title: "Channel created successfully" });
            }
        } catch (error) { console.error("Failed to create channel:", error); toast({ title: "Failed to create channel", variant: "destructive" }); }
    };

    const handleFileAttach = () => { fileInputRef.current?.click(); };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const type = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'other';
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setPendingAttachment({ file, previewUrl: base64, type, name: file.name, isHomework: false, uploading: false, progress: 0 });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'announcement': return <Megaphone className="h-4 w-4 text-amber-400" />;
            case 'voice': return <Volume2 className="h-4 w-4" />;
            default: return <Hash className="h-4 w-4" />;
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#313338] text-[#dbdee1]">
            {/* Offline Banner */}
            {isOffline && (
                <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-[11px] text-center py-1 font-semibold z-[100] uppercase tracking-widest">
                    You are offline. Changes will sync when reconnected.
                </div>
            )}

            {/* PANEL 1: Workspace Icon Rail */}
            <div className="w-[72px] bg-[#1e1f22] flex-shrink-0 flex flex-col items-center py-3 gap-2 z-30">
                {/* DM / Home Icon */}
                <div className="relative group w-full flex items-center justify-center mb-1">
                    {activeChannel === null && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-9 bg-white rounded-r-full" />
                    )}
                    <button
                        onClick={() => setActiveChannel(null)}
                        className={cn(
                            "w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden",
                            activeChannel === null
                                ? "bg-[#5865f2] text-white rounded-[16px]"
                                : "bg-[#313338] text-white/70 hover:bg-[#5865f2] hover:text-white rounded-[24px] hover:rounded-[16px]"
                        )}
                    >
                        <MessageSquare className="h-6 w-6" />
                    </button>
                </div>

                <div className="w-8 h-[2px] bg-[#35373c] rounded-full my-0.5" />

                {/* Workspace Icons */}
                {workspaces.map((workspace) => (
                    <div key={workspace.id} className="relative group w-full flex items-center justify-center">
                        {workspace.isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-9 bg-white rounded-r-full" />
                        )}
                        <button
                            className={cn(
                                "w-12 h-12 flex items-center justify-center transition-all duration-200 text-[13px] font-bold overflow-hidden",
                                workspace.isActive
                                    ? "bg-[#5865f2] text-white rounded-[16px]"
                                    : "bg-[#313338] text-[#dbdee1] hover:bg-[#5865f2] hover:text-white rounded-[24px] hover:rounded-[16px]"
                            )}
                        >
                            {workspace.name.slice(0, 2).toUpperCase()}
                        </button>
                    </div>
                ))}

                {/* Add server */}
                <button className="w-12 h-12 rounded-[24px] bg-[#313338] text-emerald-400 hover:bg-emerald-600 hover:text-white hover:rounded-[16px] flex items-center justify-center transition-all duration-200 mt-1">
                    <Plus className="h-6 w-6" />
                </button>
            </div>

            {/* PANEL 2: Channel Sidebar */}
            <>
                {/* Mobile overlay */}
                {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 z-20 md:hidden"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}
                <div className={cn(
                    "w-[240px] flex-shrink-0 z-20 flex flex-col transition-all",
                    isMobileSidebarOpen
                        ? "fixed left-[72px] top-0 h-full"
                        : "hidden md:flex"
                )}>
                    <ChannelSidebar
                        channels={channels}
                        activeChannel={activeChannel}
                        onSelectChannel={(ch) => {
                            setActiveChannel(ch);
                            setIsMobileSidebarOpen(false);
                            setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, unreadCount: 0 } : c));
                        }}
                        workspaceName={activeWorkspaceName}
                        currentUser={currentUser}
                        isLoadingChannels={isLoadingChannels}
                        onNewDM={handleNewDM}
                        onCreateChannel={handleCreateChannel}
                        onClose={() => setIsMobileSidebarOpen(false)}
                    />
                </div>
            </>

            {/* PANEL 3: Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <AnimatePresence mode="wait">
                    {activeChannel === null ? (
                        <MessagingHome currentUser={currentUser} />
                    ) : (
                        <motion.div
                            key={`chat-${activeChannel.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-col flex-1 min-w-0 overflow-hidden h-full"
                        >
                            {/* ── Chat Header ── */}
                            <div className="h-12 flex items-center px-4 border-b border-black/30 shadow-sm shrink-0 bg-[#313338] gap-3 z-10">
                                {/* Mobile menu toggle */}
                                <button
                                    className="md:hidden text-[#949ba4] hover:text-[#dbdee1] mr-1"
                                    onClick={() => setIsMobileSidebarOpen(true)}
                                >
                                    <Menu className="h-5 w-5" />
                                </button>

                                {/* Channel icon + name */}
                                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                    <span className="text-[#80848e]">
                                        {getChannelIcon(activeChannel.type)}
                                    </span>
                                    <span className="font-bold text-[#f2f3f5] text-[16px] truncate">
                                        {activeChannel.name}
                                    </span>
                                    {activeChannel.subject && (
                                        <>
                                            <div className="w-px h-5 bg-[#4e5058] mx-1 shrink-0" />
                                            <span className="text-[14px] text-[#80848e] truncate">{activeChannel.subject}</span>
                                        </>
                                    )}
                                </div>

                                {/* Right icons */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <div className="hidden sm:flex items-center bg-[#1e1f22] rounded px-2 py-1 gap-2 h-7 mr-1">
                                        <Search className="h-3.5 w-3.5 text-[#949ba4]" />
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            className="bg-transparent border-none outline-none text-[13px] text-[#dbdee1] placeholder:text-[#949ba4] w-20 focus:w-36 transition-all duration-200"
                                        />
                                    </div>
                                    <button className="p-2 text-[#b5bac1] hover:text-[#dbdee1] transition-colors" title="Notifications">
                                        <Bell className="h-5 w-5" />
                                    </button>
                                    <button className="p-2 text-[#b5bac1] hover:text-[#dbdee1] transition-colors" title="Pinned messages">
                                        <Bookmark className="h-5 w-5" />
                                    </button>
                                    <button className="p-2 text-[#b5bac1] hover:text-[#dbdee1] transition-colors hidden md:block" title="Members">
                                        <Users className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Pinned message banner */}
                            {activeChannel.pinnedMessage && (
                                <div className="bg-[#5865f2]/10 border-b border-[#5865f2]/20 px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-[#5865f2]/15 transition-colors">
                                    <Pin className="h-4 w-4 text-[#5865f2] shrink-0 -rotate-45" />
                                    <div className="flex-1 truncate text-sm">
                                        <span className="font-semibold text-[#5865f2] mr-2">Pinned:</span>
                                        <span className="text-[#dbdee1]">{activeChannel.pinnedMessage}</span>
                                    </div>
                                </div>
                            )}

                            {/* ── Message Feed ── */}
                            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#313338]">
                                {isLoadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-7 w-7 animate-spin text-[#949ba4]" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col justify-end h-full pb-10 px-4">
                                        <div className="w-16 h-16 rounded-full bg-[#2b2d31] flex items-center justify-center mb-4 border border-[#1e1f22]">
                                            <Hash className="h-8 w-8 text-[#949ba4]" />
                                        </div>
                                        <h2 className="text-[28px] font-bold text-[#f2f3f5] mb-1">
                                            Welcome to #{activeChannel.name}!
                                        </h2>
                                        <p className="text-[#949ba4] text-[16px]">
                                            This is the start of the #{activeChannel.name} channel.
                                        </p>
                                    </div>
                                ) : (
                                    <Virtuoso
                                        data={messages}
                                        initialTopMostItemIndex={messages.length - 1}
                                        followOutput="auto"
                                        className="flex-1"
                                        style={{ height: '100%' }}
                                        itemContent={(idx, msg) => {
                                            const prevMsg = messages[idx - 1];
                                            const showHeader = !prevMsg ||
                                                prevMsg.senderId !== msg.senderId ||
                                                (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 5 * 60 * 1000);

                                            const date = new Date(msg.timestamp);
                                            const formatTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const formatDate = date.toLocaleDateString();

                                            const isAI = Number(msg.senderId) === AI_TUTOR_ID;
                                            const isOwn = String(msg.senderId) === String(currentUser.profile?.uid);
                                            const isTeacherAnnouncement = activeChannel.type === 'announcement' && msg.senderRole === 'teacher';

                                            const handleTouchEnd = () => {
                                                const now = Date.now();
                                                if (now - lastTapTime < 300) { console.log("Double tapped:", msg.id); }
                                                setLastTapTime(now);
                                            };

                                            return (
                                                <ContextMenu>
                                                    <ContextMenuTrigger asChild>
                                                        <div
                                                            onTouchEnd={handleTouchEnd}
                                                            className={cn(
                                                                "group flex gap-4 px-4 hover:bg-[#2e3035] transition-colors duration-100 relative",
                                                                showHeader ? "pt-4 pb-0.5" : "pt-0.5 pb-0.5",
                                                                isTeacherAnnouncement && "bg-amber-500/5 hover:bg-amber-500/10"
                                                            )}
                                                        >
                                                            {/* Quick action bar on hover */}
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-[#2b2d31] border border-[#1e1f22] rounded-md p-1 shadow-lg z-10 transition-opacity">
                                                                <button
                                                                    className="p-1 hover:bg-[#35373c] rounded text-[#949ba4] hover:text-[#dbdee1] transition-colors"
                                                                    onClick={() => setReplyingToMessage(msg)}
                                                                    title="Reply"
                                                                >
                                                                    <MessageSquarePlus className="h-4 w-4" />
                                                                </button>
                                                                <button className="p-1 hover:bg-[#35373c] rounded text-[#949ba4] hover:text-amber-400 transition-colors" title="React">
                                                                    <Smile className="h-4 w-4" />
                                                                </button>
                                                            </div>

                                                            {/* Avatar column */}
                                                            {showHeader ? (
                                                                <Avatar className={cn("h-10 w-10 rounded-full shrink-0 mt-0.5", isAI && "ring-2 ring-[#5865f2]/40")}>
                                                                    {msg.avatar && <AvatarImage src={msg.avatar} />}
                                                                    <AvatarFallback className={cn(
                                                                        "text-white text-sm font-bold rounded-full",
                                                                        isAI ? "bg-[#5865f2]" : "bg-gradient-to-br from-[#5865f2] to-[#7c3aed]"
                                                                    )}>
                                                                        {isAI ? <Bot className="h-5 w-5" /> : getInitials(msg.senderName || "U")}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            ) : (
                                                                <div className="w-10 shrink-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <span className="text-[10px] text-[#4e5058] select-none">{formatTime}</span>
                                                                </div>
                                                            )}

                                                            {/* Message content column */}
                                                            <div className="flex-1 min-w-0">
                                                                {showHeader && (
                                                                    <div className="flex items-baseline gap-2 mb-0.5">
                                                                        <span className={cn(
                                                                            "font-semibold text-[15px] leading-none cursor-pointer hover:underline",
                                                                            msg.senderRole === "teacher" ? "text-amber-400" : (isAI ? "text-[#5865f2]" : "text-[#f2f3f5]")
                                                                        )}>
                                                                            {msg.senderName}
                                                                        </span>
                                                                        {isAI && (
                                                                            <span className="text-[9px] font-bold bg-[#5865f2] text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                                                                AI
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[11px] text-[#4e5058] font-normal">{formatDate} {formatTime}</span>
                                                                        {isOwn && (
                                                                            <span className="text-[10px] text-[#4e5058]">
                                                                                {msg.status === 'sending' ? '⏳' : msg.status === 'error' ? '❌' : ''}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {isTeacherAnnouncement && showHeader && (
                                                                    <div className="flex items-center gap-1.5 mb-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 w-fit px-2 py-0.5 rounded-sm">
                                                                        <Megaphone className="h-3 w-3" /> Class Announcement
                                                                    </div>
                                                                )}

                                                                <div className={cn(
                                                                    "text-[15px] leading-relaxed break-words",
                                                                    isTeacherAnnouncement ? "text-amber-100/90" : "text-[#dbdee1]"
                                                                )}>
                                                                    <div className="prose prose-sm max-w-none">
                                                                        <ReactMarkdown
                                                                            remarkPlugins={[remarkGfm, remarkMath]}
                                                                            rehypePlugins={[rehypeKatex]}
                                                                            components={{
                                                                                p: ({ node, ...props }) => <p className="m-0 text-[#dbdee1]" {...props} />,
                                                                                a: ({ node, ...props }) => <a className="text-[#00a8fc] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                                                code: ({ node, inline, ...props }: any) => (
                                                                                    inline ? (
                                                                                        <code className="bg-[#2b2d31] text-[#dbdee1] px-1 py-0.5 rounded text-[13px] font-mono" {...props} />
                                                                                    ) : (
                                                                                        <div className="bg-[#2b2d31] p-3 rounded-md overflow-x-auto my-2 border border-[#1e1f22]">
                                                                                            <code className="text-[13px] font-mono text-[#dbdee1]" {...props} />
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
                                                                                ? "bg-emerald-500/10 border-emerald-500/30"
                                                                                : "bg-[#2b2d31] border-[#1e1f22]"
                                                                        )}>
                                                                            {msg.attachment.isHomework && (
                                                                                <div className="flex items-center gap-1.5 mb-2 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                                                                    <School className="h-3 w-3" /> Homework Submission
                                                                                </div>
                                                                            )}
                                                                            {msg.attachment.type === 'image' ? (
                                                                                <img src={msg.attachment.url} alt={msg.attachment.name} className="w-full h-auto rounded border border-[#1e1f22]" />
                                                                            ) : (
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="bg-[#1e1f22] p-2 rounded">
                                                                                        <Paperclip className="h-5 w-5 text-[#949ba4]" />
                                                                                    </div>
                                                                                    <span className="text-sm truncate text-[#dbdee1]">{msg.attachment.name}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </ContextMenuTrigger>

                                                    {/* Context Menu */}
                                                    <ContextMenuContent className="w-52 bg-[#111214] border-[#1e1f22] text-[#dbdee1] shadow-2xl rounded-md z-50">
                                                        <ContextMenuItem onClick={() => setReplyingToMessage(msg)} className="cursor-pointer hover:bg-[#5865f2] focus:bg-[#5865f2] py-2 rounded-sm">
                                                            <MessageSquarePlus className="mr-2 h-4 w-4" /> Reply
                                                        </ContextMenuItem>
                                                        <ContextMenuItem className="cursor-pointer hover:bg-[#5865f2] focus:bg-[#5865f2] py-2 rounded-sm">
                                                            <Smile className="mr-2 h-4 w-4" /> Add Reaction
                                                        </ContextMenuItem>
                                                        {isOwn && (
                                                            <ContextMenuItem className="cursor-pointer hover:bg-[#5865f2] focus:bg-[#5865f2] py-2 rounded-sm">
                                                                <Settings className="mr-2 h-4 w-4" /> Edit Message
                                                            </ContextMenuItem>
                                                        )}
                                                        {currentUser.profile?.role === 'teacher' && (
                                                            <ContextMenuItem className="cursor-pointer hover:bg-[#5865f2] focus:bg-[#5865f2] py-2 rounded-sm">
                                                                <Pin className="mr-2 h-4 w-4 text-amber-400" /> Pin Message
                                                            </ContextMenuItem>
                                                        )}
                                                        <ContextMenuSeparator className="bg-[#1e1f22] my-1" />
                                                        {(isOwn || currentUser.profile?.role === 'teacher') ? (
                                                            <ContextMenuItem className="cursor-pointer hover:bg-red-500 focus:bg-red-500 text-red-400 focus:text-white py-2 rounded-sm">
                                                                Delete Message
                                                            </ContextMenuItem>
                                                        ) : (
                                                            <ContextMenuItem className="cursor-pointer hover:bg-red-500 focus:bg-red-500 text-red-400 focus:text-white py-2 rounded-sm">
                                                                Report Message
                                                            </ContextMenuItem>
                                                        )}
                                                    </ContextMenuContent>
                                                </ContextMenu>
                                            );
                                        }}
                                    />
                                )}
                            </div>

                            {/* ── Message Input Area ── */}
                            <div className="px-4 pb-6 pt-2 bg-[#313338] shrink-0">
                                {/* Typing Indicator */}
                                <AnimatePresence>
                                    {Object.keys(typingUsers).length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 text-[12px] text-[#949ba4] mb-1 px-1"
                                        >
                                            <div className="flex gap-0.5">
                                                <div className="w-1 h-1 bg-[#949ba4] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1 h-1 bg-[#949ba4] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1 h-1 bg-[#949ba4] rounded-full animate-bounce" />
                                            </div>
                                            {Object.values(typingUsers).length === 1
                                                ? `${Object.values(typingUsers)[0].username} is typing...`
                                                : `${Object.values(typingUsers).length} people are typing...`}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Reply Banner */}
                                {replyingToMessage && (
                                    <div className="bg-[#2b2d31] border border-[#1e1f22] rounded-t-lg px-4 py-2 flex items-center justify-between -mb-1">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <MessageSquarePlus className="h-4 w-4 text-[#5865f2] shrink-0" />
                                            <span className="text-[12px] text-[#5865f2] font-semibold shrink-0">
                                                Replying to {replyingToMessage.senderName}
                                            </span>
                                            <span className="text-[12px] text-[#949ba4] truncate">{replyingToMessage.content}</span>
                                        </div>
                                        <button onClick={() => setReplyingToMessage(null)} className="text-[#949ba4] hover:text-[#dbdee1] ml-2">
                                            ×
                                        </button>
                                    </div>
                                )}

                                {/* Pending attachment */}
                                {pendingAttachment && (
                                    <div className="bg-[#2b2d31] border border-[#1e1f22] rounded-t-lg p-3 flex items-center gap-3 -mb-1 relative">
                                        <button
                                            onClick={() => setPendingAttachment(null)}
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                                        >×</button>
                                        {pendingAttachment.type === 'image' ? (
                                            <img src={pendingAttachment.previewUrl} className="h-14 w-14 rounded object-cover border border-[#1e1f22]" />
                                        ) : (
                                            <div className="h-14 w-14 bg-[#1e1f22] rounded flex items-center justify-center border border-[#1e1f22]">
                                                <Paperclip className="h-5 w-5 text-[#949ba4]" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-[#dbdee1] truncate font-medium">{pendingAttachment.name}</p>
                                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center",
                                                    pendingAttachment.isHomework ? "bg-emerald-500 border-emerald-500" : "bg-[#1e1f22] border-[#4e5058]"
                                                )}>
                                                    {pendingAttachment.isHomework && <span className="text-white text-[10px]">✔</span>}
                                                </div>
                                                <span className="text-[12px] text-[#949ba4]">Submit for grading</span>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={pendingAttachment.isHomework}
                                                    onChange={e => setPendingAttachment(prev => prev ? { ...prev, isHomework: e.target.checked } : null)}
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
                                        "flex items-center bg-[#383a40] rounded-lg overflow-hidden",
                                        (replyingToMessage || pendingAttachment) && "rounded-t-none"
                                    )}
                                >
                                    {/* Add file button */}
                                    <button
                                        type="button"
                                        onClick={handleFileAttach}
                                        className="px-4 py-3 text-[#949ba4] hover:text-[#dbdee1] transition-colors shrink-0"
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
                                            const now = Date.now();
                                            if (now - lastTypingTimeRef.current > 2000 && activeChannel && ws) {
                                                ws.send(JSON.stringify({ type: "typing", channelId: activeChannel.id }));
                                                lastTypingTimeRef.current = now;
                                            }
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder={
                                            activeChannel.type === 'announcement' && currentUser.profile?.role !== 'teacher'
                                                ? "Only teachers can post here"
                                                : `Message #${activeChannel.name}`
                                        }
                                        disabled={activeChannel.type === 'announcement' && currentUser.profile?.role !== 'teacher'}
                                        className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#dbdee1] placeholder:text-[#4e5058] py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />

                                    {/* Right icons */}
                                    <div className="flex items-center gap-1 px-3">
                                        <button type="button" className="text-[#949ba4] hover:text-[#dbdee1] transition-colors p-1" title="Voice message">
                                            <Mic className="h-5 w-5" />
                                        </button>
                                        <button type="button" className="text-[#949ba4] hover:text-[#dbdee1] transition-colors p-1" title="Emoji">
                                            <Smile className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="submit"
                                            className="ml-1 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded px-3 py-1.5 text-[13px] font-semibold transition-colors flex items-center gap-1.5"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
