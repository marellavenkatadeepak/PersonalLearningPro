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
    Image as ImageIcon,
    Paperclip,
    Smile,
    School,
    BookOpen,
    MessageSquarePlus,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Types based on our schema
interface Channel {
    id: number;
    name: string;
    type: string;
    class: string | null;
    subject: string | null;
}

interface Message {
    id: number;
    channelId: number;
    senderId: number;
    content: string;
    timestamp: string;
    senderName?: string;
    senderRole?: string;
    avatar?: string;
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

    const [channels, setChannels] = useState<Channel[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);

    const [inputValue, setInputValue] = useState("");
    const [isLoadingChannels, setIsLoadingChannels] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fallback to Grade 11-A for demo purposes if user class is absent
    const userClass = currentUser.profile?.classId || "Grade 11-A";

    // Mock Workspaces for the Far-Left Rail
    const workspaces: Workspace[] = [
        { id: "class", name: userClass, icon: <School className="h-5 w-5" />, isActive: true },
        { id: "club", name: "Science Club", icon: <BookOpen className="h-5 w-5" />, isActive: false },
        { id: "help", name: "Global Help", icon: <MessageSquare className="h-5 w-5" />, isActive: false }
    ];

    // Fetch Channels on Component Mount
    useEffect(() => {
        const fetchChannels = async () => {
            if (!currentUser.profile?.uid) return;
            setIsLoadingChannels(true);
            try {
                const res = await apiRequest("GET", `/api/channels/${encodeURIComponent(userClass)}?userId=${currentUser.profile.uid}`);
                const data = await res.json();
                setChannels(data);
                if (data.length > 0) setActiveChannel(data[0]);
            } catch (error) {
                console.error("Failed to fetch channels:", error);
            } finally {
                setIsLoadingChannels(false);
            }
        };
        if (currentUser.profile?.uid) {
            fetchChannels();
        }
    }, [userClass, currentUser.profile?.uid]);

    // Fetch Messages when Active Channel changes
    useEffect(() => {
        if (!activeChannel) return;

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const res = await apiRequest("GET", `/api/messages/${activeChannel.id}`);
                const data = await res.json();
                setMessages(data);
                scrollToBottom();
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [activeChannel]);

    // Set up WebSocket connection
    useEffect(() => {
        // Determine WS URL based on current origin
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("WebSocket connected");
            setWs(socket);
        };

        socket.onmessage = (event) => {
            try {
                const wsMessage = JSON.parse(event.data);
                if (wsMessage.type === "NEW_MESSAGE") {
                    const newMsg = wsMessage.data;
                    // Only append if it belongs to the currently active channel
                    setMessages(prev => {
                        if (activeChannel && newMsg.channelId === activeChannel.id) {
                            const updated = [...prev, newMsg];
                            setTimeout(scrollToBottom, 50);
                            return updated;
                        }
                        return prev;
                    });
                }
            } catch (e) {
                console.error("Error parsing WS message:", e);
            }
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
            setWs(null);
        };

        return () => {
            socket.close();
        };
    }, [activeChannel]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || !activeChannel || !currentUser.profile?.uid) return;

        try {
            await apiRequest("POST", "/api/messages", {
                channelId: activeChannel.id,
                senderId: currentUser.profile.uid,
                senderName: currentUser.profile.displayName || "Unknown User",
                senderRole: currentUser.profile.role || "student",
                avatar: currentUser.profile.photoURL || null,
                content: inputValue.trim()
            });
            setInputValue("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Group channels by subject for the sidebar
    const groupedChannels = channels.reduce((acc, channel) => {
        if (channel.type === "dm") {
            if (!acc["Direct Messages"]) acc["Direct Messages"] = [];
            acc["Direct Messages"].push(channel);
            return acc;
        }

        const subject = channel.subject || "General";
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(channel);
        return acc;
    }, {} as Record<string, Channel[]>);

    const getChannelIcon = (type: string, name?: string) => {
        switch (type) {
            case 'announcement': return <Megaphone className="h-4 w-4 shrink-0" />;
            case 'voice': return <Volume2 className="h-4 w-4 shrink-0" />;
            case 'dm': return (
                <Avatar className="h-4 w-4 shrink-0 mr-1">
                    <AvatarFallback className="text-[8px] bg-primary/20 text-primary">{getInitials(name || "U")}</AvatarFallback>
                </Avatar>
            );
            default: return <Hash className="h-4 w-4 shrink-0" />;
        }
    };

    const handleNewDM = async () => {
        const otherUserId = window.prompt("Enter User ID to start a DM (e.g. 'student1' or 'teacher1'):");
        if (!otherUserId || !currentUser.profile?.uid) return;

        try {
            const res = await apiRequest("POST", "/api/channels/dm", {
                userIds: [currentUser.profile.uid, otherUserId]
            });
            const newDm = await res.json();

            // Check if it already exists in the list
            setChannels(prev => {
                if (prev.find(c => c.id === newDm.id)) return prev;
                return [...prev, newDm];
            });
            setActiveChannel(newDm);
        } catch (error) {
            console.error("Failed to start DM:", error);
        }
    };

    const handleFileAttach = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            // Append markdown image syntax to input value
            setInputValue(prev => prev + (prev ? '\n' : '') + `![${file.name}](${base64})`);
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex h-screen w-full overflow-hidden bg-[#313338] text-white"
        >

            {/* PANEL 1: Far-Left Rail (Workspaces) */}
            <div className="w-[72px] bg-[#1e1f22] flex-shrink-0 flex flex-col items-center py-3 gap-3 hidden md:flex">
                <div className="relative group flex items-center justify-center w-full">
                    <button
                        className={cn(
                            "w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden relative z-10",
                            !activeChannel || activeChannel.type === "dm"
                                ? "bg-primary text-primary-foreground rounded-[16px]"
                                : "bg-[#313338] text-[#dbdee1] hover:bg-primary hover:text-primary-foreground rounded-[24px] hover:rounded-[16px]"
                        )}
                        onClick={() => setActiveChannel(null)}
                    >
                        <MessageSquare className="h-6 w-6" />
                    </button>
                    {(!activeChannel || activeChannel.type === "dm") ? (
                        <motion.div
                            layoutId="active-nav-pill"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    ) : (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-md group-hover:h-5 transition-all duration-200" />
                    )}
                </div>

                <Separator className="w-8 h-[2px] bg-[#3f4147] my-1 rounded" />

                {workspaces.map((ws) => (
                    <div key={ws.id} className="relative group w-full flex items-center justify-center">
                        {ws.isActive ? (
                            <motion.div
                                layoutId="active-nav-pill"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        ) : (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-md group-hover:h-5 transition-all duration-200" />
                        )}
                        <button
                            className={cn(
                                "w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden",
                                ws.isActive
                                    ? "bg-primary text-primary-foreground rounded-[16px]"
                                    : "bg-[#313338] text-[#dbdee1] hover:bg-primary hover:text-primary-foreground rounded-[24px] hover:rounded-[16px]"
                            )}
                        >
                            {ws.icon}
                        </button>
                    </div>
                ))}

                <button className="w-12 h-12 rounded-[24px] bg-[#313338] text-emerald-500 hover:bg-emerald-500 hover:text-white hover:rounded-[16px] flex items-center justify-center transition-all duration-200 mt-2">
                    <span className="text-2xl font-light mb-1">+</span>
                </button>
            </div>

            {/* PANEL 2: Channel Sidebar */}
            <div className={cn(
                "bg-[#2b2d31] flex flex-col transition-all duration-300",
                isMobileSidebarOpen ? "w-64 absolute z-20 h-full shadow-xl" : "hidden md:flex md:w-[240px]"
            )}>
                {/* Search / Top Nav */}
                <div className="h-12 border-b border-[#1f2023] flex items-center px-3 font-semibold shadow-sm justify-between">
                    <button className="w-full bg-[#1e1f22] text-[#949ba4] text-sm text-left px-2 py-1.5 rounded-md hover:bg-[#313338] transition-colors">
                        Find or start a conversation
                    </button>
                    <Button variant="ghost" size="icon" className="md:hidden ml-2" onClick={() => setIsMobileSidebarOpen(false)}>
                        <Menu className="h-4 w-4" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 px-2 py-3">
                    {/* Friends Buttons */}
                    <div className="space-y-0.5 mb-4">
                        <button
                            onClick={() => setActiveChannel(null)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-[15px] transition-colors",
                                activeChannel === null
                                    ? "bg-[#404249] text-white font-medium"
                                    : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
                            )}
                        >
                            <Users className="h-5 w-5" />
                            Friends
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[15px] text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors">
                            <Settings className="h-5 w-5" />
                            Nitro
                        </button>
                    </div>

                    {isLoadingChannels ? (
                        <div className="flex items-center justify-center h-20">
                            <Loader2 className="h-5 w-5 animate-spin text-[#949ba4]" />
                        </div>
                    ) : (
                        Object.entries(groupedChannels).map(([subject, subjectChannels]) => (
                            <div key={subject} className="mb-4">
                                <div className="flex items-center justify-between px-2 mb-[2px] mt-4 group/header">
                                    <h3 className="text-[11px] uppercase font-bold text-[#949ba4] hover:text-[#dbdee1] cursor-pointer tracking-wider">
                                        {subject}
                                    </h3>
                                    {subject === "Direct Messages" && (
                                        <button
                                            onClick={handleNewDM}
                                            className="text-[#949ba4] hover:text-[#dbdee1] opacity-0 group-hover/header:opacity-100 transition-opacity"
                                            title="Start new DM"
                                        >
                                            <MessageSquarePlus className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-[2px]">
                                    {subjectChannels.map((channel) => (
                                        <button
                                            key={channel.id}
                                            onClick={() => {
                                                setActiveChannel(channel);
                                                setIsMobileSidebarOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-2 py-[6px] rounded-md text-[15px] transition-colors",
                                                activeChannel?.id === channel.id
                                                    ? "bg-[#404249] text-white"
                                                    : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
                                            )}
                                        >
                                            {getChannelIcon(channel.type, channel.name)}
                                            <span className="truncate">{channel.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </ScrollArea>

                {/* User Mini Profile */}
                <div className="px-2 py-1.5 h-[52px] bg-[#232428] flex items-center gap-2 flex-shrink-0">
                    <button className="flex items-center gap-2 hover:bg-[#3f4147] p-1 rounded-md flex-1 overflow-hidden transition-colors text-left">
                        <Avatar className="h-8 w-8 rounded-full">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                                {getInitials(currentUser.profile?.displayName || "User")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[13px] font-semibold text-white truncate leading-tight">{currentUser.profile?.displayName}</p>
                            <p className="text-[11px] text-[#949ba4] truncate leading-tight group-hover:text-[#dbdee1]">Online</p>
                        </div>
                    </button>
                    <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#3f4147] rounded-md">
                            <Volume2 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#3f4147] rounded-md">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* PANEL 3: Main Content Area */}
            <div className="flex-1 bg-[#313338] flex flex-col min-w-0 relative">
                <AnimatePresence mode="wait">
                    {activeChannel === null ? (
                        /* FRIENDS VIEW */
                        <motion.div
                            key="friends-view"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-1 overflow-hidden"
                        >
                            {/* Friends List & Add Friend Section */}
                            <div className="flex-1 flex flex-col min-w-0">
                                {/* Top Nav (Friends Header) */}
                                <div className="h-12 border-b border-[#1f2023] flex items-center px-4 shadow-sm z-10 shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-white font-semibold">
                                            <Users className="h-6 w-6 text-[#949ba4]" />
                                            <span>Friends</span>
                                        </div>
                                        <Separator orientation="vertical" className="h-6 bg-[#3f4147]" />
                                        <div className="flex items-center gap-4">
                                            <button className="text-[#dbdee1] font-medium text-[15px] hover:text-white px-2 py-1 bg-[#404249] rounded-md transition-colors">Add Friend</button>
                                        </div>
                                    </div>
                                </div>

                                <ScrollArea className="flex-1 px-8 py-6">
                                    <div className="max-w-[700px]">
                                        <h2 className="text-white font-semibold mb-2">Add Friend</h2>
                                        <p className="text-[#dbdee1] text-sm mb-4">You can add friends with their Discord username.</p>

                                        <div className="relative flex items-center mb-8">
                                            <input
                                                type="text"
                                                placeholder="You can add friends with their Discord username."
                                                className="w-full bg-[#1e1f22] border border-[#1e1f22] hover:border-[#1e1f22] focus:border-[#5865F2] rounded-lg py-3 px-4 text-[#dbdee1] outline-none transition-colors"
                                            />
                                            <button className="absolute right-2 bg-[#5865F2] text-white text-sm font-medium px-4 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                                Send Friend Request
                                            </button>
                                        </div>

                                        <h2 className="text-white font-semibold mb-4">Other Places to Make Friends</h2>
                                        <p className="text-[#dbdee1] text-sm mb-4">Don't have a username on hand? Check out our list of public servers that includes everything from gaming to cooking, music, anime and more.</p>

                                        <button className="w-full flex items-center justify-between bg-[#2b2d31] hover:bg-[#35373c] p-4 rounded-lg transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-[#23a559] p-2 rounded-lg">
                                                    <Search className="h-5 w-5 text-white inline-block" />
                                                </div>
                                                <span className="text-white font-medium">Explore Discoverable Servers</span>
                                            </div>
                                            <Search className="h-5 w-5 text-[#949ba4] group-hover:text-[#dbdee1] opacity-50" />
                                        </button>
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Active Now Sidebar */}
                            <div className="w-[360px] border-l border-[#1f2023] hidden lg:flex flex-col p-4">
                                <h3 className="font-bold text-white text-xl mb-4 text-[20px] leading-tight mt-2">Active Now</h3>
                                <div className="flex flex-col items-center justify-center text-center mt-4">
                                    <p className="text-white font-semibold mb-1">It's quiet for now...</p>
                                    <p className="text-[#dbdee1] text-sm px-4">When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* CHAT VIEW (Preserved from original but styled) */
                        <motion.div
                            key="chat-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col flex-1 min-w-0 overflow-hidden"
                        >
                            {/* Chat Header */}
                            <div className="h-12 border-b border-[#1f2023] flex items-center px-4 justify-between shadow-sm z-10 bg-[#313338] shrink-0">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Button variant="ghost" size="icon" className="md:hidden mr-1" onClick={() => setIsMobileSidebarOpen(true)}>
                                        <Menu className="h-5 w-5 text-[#949ba4]" />
                                    </Button>
                                    <span className="text-[#949ba4]">{getChannelIcon(activeChannel.type, activeChannel.name)}</span>
                                    <span className="font-semibold text-white truncate">{activeChannel.name}</span>
                                    {activeChannel.subject && (
                                        <>
                                            <Separator orientation="vertical" className="h-5 mx-1 bg-[#3f4147]" />
                                            <span className="text-[13px] text-[#dbdee1] truncate">
                                                {activeChannel.subject}
                                            </span>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 text-[#949ba4]">
                                    <div className="hidden sm:flex items-center bg-[#1e1f22] rounded-md px-2 py-1 h-7 text-xs mr-2">
                                        <Search className="h-3.5 w-3.5 mr-1" />
                                        <input type="text" placeholder="Search" className="bg-transparent text-white border-none outline-none w-24 focus:w-32 transition-all placeholder:text-[#949ba4]" />
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:flex hover:text-[#dbdee1] hover:bg-[#3f4147]">
                                        <Users className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Message Feed */}
                            <ScrollArea className="flex-1 px-4 py-2 bg-[#313338]">
                                {isLoadingMessages ? (
                                    <div className="flex items-center justify-center h-full pt-10">
                                        <Loader2 className="h-6 w-6 animate-spin text-[#949ba4]" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col justify-end min-h-[100%] pb-8 pt-32 px-2">
                                        <div className="w-[68px] h-[68px] rounded-full bg-[#404249] flex items-center justify-center mb-4">
                                            <Hash className="h-10 w-10 text-white" />
                                        </div>
                                        <h2 className="text-[32px] font-bold mb-2 text-white">Welcome to #{activeChannel.name}!</h2>
                                        <p className="text-[#dbdee1] mb-4">This is the start of the #{activeChannel.name} channel.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pb-4">
                                        <AnimatePresence initial={false}>
                                            {messages.map((msg, idx) => {
                                                const prevMsg = messages[idx - 1];
                                                const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId ||
                                                    (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 5 * 60 * 1000);

                                                const date = new Date(msg.timestamp);
                                                const formatTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                const formatDate = date.toLocaleDateString();

                                                return (
                                                    <motion.div
                                                        key={msg.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        className={cn("group flex gap-4 px-1 hover:bg-[#2b2d31]/50 pt-[2px] pb-1 -mx-4 px-4 rounded-sm", showHeader ? "mt-4" : "mt-0")}
                                                    >
                                                        {showHeader ? (
                                                            <Avatar className="h-10 w-10 mt-0.5 shrink-0 cursor-pointer">
                                                                <AvatarFallback className="bg-[#5865F2] text-white">
                                                                    {getInitials(msg.senderName || "U")}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ) : (
                                                            <div className="w-10 flex-shrink-0 text-right opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-[#949ba4] select-none mt-[2px]">
                                                                {formatTime}
                                                            </div>
                                                        )}

                                                        <div className="flex-1 flex flex-col min-w-0">
                                                            {showHeader && (
                                                                <div className="flex items-baseline gap-2 leading-none mb-1">
                                                                    <span className={cn(
                                                                        "font-medium hover:underline cursor-pointer",
                                                                        msg.senderRole === "teacher" ? "text-amber-500" : "text-white"
                                                                    )}>
                                                                        {msg.senderName}
                                                                    </span>
                                                                    <span className="text-xs text-[#949ba4] font-medium ml-1">
                                                                        {formatDate} {formatTime}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="text-[#dbdee1] text-[15px] leading-relaxed break-words">
                                                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-[1.375rem] prose-pre:p-0 prose-p:mb-0 last:prose-p:mb-0 text-[#dbdee1]">
                                                                    <ReactMarkdown
                                                                        remarkPlugins={[remarkGfm, remarkMath]}
                                                                        rehypePlugins={[rehypeKatex]}
                                                                        components={{
                                                                            p: ({ node, ...props }) => <p className="m-0 mb-0 last:mb-0 text-[#dbdee1]" {...props} />,
                                                                            a: ({ node, ...props }) => <a className="text-[#00a8fc] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                                            code: ({ node, inline, ...props }: any) => (
                                                                                inline ? (
                                                                                    <code className="bg-[#1e1f22] text-[#dbdee1] px-1.5 py-0.5 rounded text-[14px] font-mono" {...props} />
                                                                                ) : (
                                                                                    <div className="bg-[#1e1f22] p-3 rounded-md overflow-x-auto my-2 border border-[#1f2023]">
                                                                                        <code className="text-[13px] font-mono text-[#dbdee1]" {...props} />
                                                                                    </div>
                                                                                )
                                                                            )
                                                                        }}
                                                                    >
                                                                        {msg.content}
                                                                    </ReactMarkdown>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Message Input Area */}
                            <div className="px-4 pb-6 bg-[#313338] pt-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <form onSubmit={handleSendMessage} className="bg-[#383a40] rounded-lg shrink-0 flex items-center p-1 relative">
                                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-[#b5bac1] shrink-0 rounded-full hover:bg-transparent hover:text-[#dbdee1]" onClick={handleFileAttach}>
                                        <div className="bg-[#dbdee1] text-[#383a40] rounded-full p-1 h-6 w-6 flex items-center justify-center">
                                            <span className="font-bold leading-none mb-[2px]">+</span>
                                        </div>
                                    </Button>
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={`Message ${activeChannel.type === 'dm' ? '@' + activeChannel.name : '#' + activeChannel.name}`}
                                        className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-[15px] px-2 h-11 text-[#dbdee1] placeholder:text-[#949ba4]"
                                        disabled={activeChannel.type === 'announcement' && currentUser.profile?.role !== 'teacher'}
                                    />
                                    <div className="flex items-center gap-1 pr-2">
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[#b5bac1] rounded hover:bg-transparent hover:text-[#dbdee1]">
                                            <Smile className="h-6 w-6" />
                                        </Button>
                                    </div>
                                </form>
                                {activeChannel.type === 'announcement' && currentUser.profile?.role !== 'teacher' && (
                                    <p className="text-xs text-center mt-2 text-[#949ba4]">Only teachers can send messages in this channel.</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
