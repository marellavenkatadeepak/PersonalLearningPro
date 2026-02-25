import { useState, useEffect, useRef } from "react";
import { useFirebaseAuth } from "@/contexts/firebase-auth-context";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { cn, getInitials } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import { MessagingHome } from "@/components/messaging/messaging-home";
import { ChannelSidebar } from "@/components/messaging/channel-sidebar";
import { MessageBubble } from "@/components/messaging/message-bubble";
import { Composer } from "@/components/messaging/composer";
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
// Removed context menu imports, handled in MessageBubble
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
        <div className="flex h-screen w-full overflow-hidden bg-[#F5F7FB] text-gray-800">
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
                            <div className="h-14 flex items-center px-6 border-b border-gray-200 shadow-sm shrink-0 bg-white gap-3 z-10 transition-colors">
                                {/* Mobile menu toggle */}
                                <button
                                    className="md:hidden text-gray-400 hover:text-gray-600 mr-1"
                                    onClick={() => setIsMobileSidebarOpen(true)}
                                >
                                    <Menu className="h-5 w-5" />
                                </button>

                                {/* Channel icon + name */}
                                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                    <span className="text-gray-400">
                                        {getChannelIcon(activeChannel.type)}
                                    </span>
                                    <span className="font-bold text-gray-800 text-[18px] tracking-tight truncate">
                                        {activeChannel.name}
                                    </span>
                                    {activeChannel.subject && (
                                        <>
                                            <div className="w-px h-5 bg-gray-300 mx-2 shrink-0" />
                                            <span className="text-[14px] font-medium text-gray-500 truncate">{activeChannel.subject}</span>
                                        </>
                                    )}
                                </div>

                                {/* Right icons */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="hidden sm:flex items-center bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 gap-2 h-9 mr-1 focus-within:ring-2 focus-within:ring-[#4F6BED]/20 focus-within:border-[#4F6BED]/30 transition-all">
                                        <Search className="h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            className="bg-transparent border-none outline-none text-[13px] text-gray-700 placeholder:text-gray-400 w-24 focus:w-40 transition-all duration-200"
                                        />
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="Notifications">
                                        <Bell className="h-5 w-5" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="Pinned messages">
                                        <Bookmark className="h-5 w-5" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors hidden md:block" title="Members">
                                        <Users className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Pinned message banner */}
                            {activeChannel.pinnedMessage && (
                                <div className="bg-[#FFF9E6] border-b border-amber-200/50 px-6 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-amber-50 transition-colors">
                                    <Pin className="h-4 w-4 text-amber-500 shrink-0 -rotate-45" />
                                    <div className="flex-1 text-sm">
                                        <span className="font-semibold text-amber-700 mr-2 uppercase tracking-wide text-[11px]">Pinned by teacher</span>
                                        <span className="text-gray-700 font-medium">{activeChannel.pinnedMessage}</span>
                                    </div>
                                </div>
                            )}

                            {/* ── Message Feed ── */}
                            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#F5F7FB]">
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
                                                <MessageBubble
                                                    msg={msg as any}
                                                    isOwn={isOwn}
                                                    isAI={isAI}
                                                    isTeacherAnnouncement={isTeacherAnnouncement}
                                                    showHeader={showHeader}
                                                    formatTime={formatTime}
                                                    formatDate={formatDate}
                                                    isTeacherStatus={currentUser.profile?.role === 'teacher'}
                                                    onReply={setReplyingToMessage}
                                                    onDoubleTap={handleTouchEnd}
                                                />
                                            );
                                        }}
                                    />
                                )}
                            </div>

                            {/* ── Message Input Area ── */}
                            <Composer
                                inputValue={inputValue}
                                setInputValue={setInputValue}
                                handleSendMessage={handleSendMessage}
                                handleKeyDown={handleKeyDown}
                                handleFileAttach={handleFileAttach}
                                fileInputRef={fileInputRef}
                                handleFileChange={handleFileChange}
                                activeChannel={activeChannel}
                                currentUser={currentUser}
                                replyingToMessage={replyingToMessage}
                                setReplyingToMessage={setReplyingToMessage}
                                pendingAttachment={pendingAttachment}
                                setPendingAttachment={setPendingAttachment}
                                typingUsers={typingUsers}
                                handleTyping={() => {
                                    const now = Date.now();
                                    if (now - lastTypingTimeRef.current > 2000 && activeChannel && ws) {
                                        ws.send(JSON.stringify({ type: "typing", channelId: activeChannel.id }));
                                        lastTypingTimeRef.current = now;
                                    }
                                }}
                                onAskAITutor={() => {
                                    setInputValue(prev => prev ? prev + " @AI Tutor " : "@AI Tutor ");
                                }}
                            />

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
