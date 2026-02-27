// ─── REST API client for the messaging feature ────────────────────────────────
// All functions throw on non-ok responses.

export interface ApiWorkspace {
    id: number;
    name: string;
    ownerId: number;
    members: number[];
}

export interface ApiChannel {
    id: number;
    name: string;
    type: 'text' | 'dm' | 'announcement';
    workspaceId: number | null;
    subject?: string;
    class?: string;
    pinnedMessages?: number[];
}

export interface ApiMessage {
    id: number;
    channelId: number;
    authorId: number;
    authorUsername?: string;
    content: string;
    type: 'text' | 'file' | 'image';
    fileUrl?: string | null;
    readBy: number[];
    isHomework?: boolean;
    homeworkStatus?: 'pending' | 'graded';
    createdAt: string;
}

export interface ApiDM extends ApiChannel {
    partner?: {
        id: number;
        username: string;
        avatar?: string;
        role: string;
    };
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        credentials: 'include', // send session cookie
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${body}`);
    }
    return res.json() as Promise<T>;
}

// ─── Workspaces ──────────────────────────────────────────────────────────────

export function fetchWorkspaces(): Promise<ApiWorkspace[]> {
    return apiFetch<ApiWorkspace[]>('/api/workspaces');
}

// ─── Channels ────────────────────────────────────────────────────────────────

export function fetchChannels(workspaceId: number): Promise<ApiChannel[]> {
    return apiFetch<ApiChannel[]>(`/api/workspaces/${workspaceId}/channels`);
}

export function fetchDMs(): Promise<ApiDM[]> {
    return apiFetch<ApiDM[]>('/api/users/me/dms');
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function fetchMessages(
    channelId: number,
    limit = 50,
    before?: number,
): Promise<ApiMessage[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before != null) params.set('before', String(before));
    return apiFetch<ApiMessage[]>(`/api/channels/${channelId}/messages?${params}`);
}

// ─── File upload ──────────────────────────────────────────────────────────────

export interface UploadResult {
    url: string;
    name: string;
    size: number;
    mimeType: string;
}

export async function uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
        // Do NOT set Content-Type — browser sets it with the correct boundary
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Upload failed: ${res.status} ${body}`);
    }

    return res.json() as Promise<UploadResult>;
}
