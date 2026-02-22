# Discord-Style Backend Implementation Plan (MessagePal)

This plan outlines the architecture for a highly scalable, real-time messaging backend inspired by Discord's infrastructure.

## 1. Architectural Overview

### Core Technologies
- **Language:** TypeScript (Node.js/Express)
- **Primary Database (Metadata):** PostgreSQL (for Users, Guilds, Channels, Permissions)
- **Message Store (High Volume):** MongoDB (Sharded) or ScyllaDB (Long-term)
- **Real-time:** WebSockets (Socket.io)
- **Caching & Presence:** Redis
- **File Storage:** AWS S3 or MinIO

## 2. Database Schema Design

### A. Metadata (Relational - PostgreSQL)
- **Users:** `id`, `username`, `email`, `password_hash`, `avatar_url`, `status`
- **Guilds (Servers):** `id`, `name`, `owner_id`, `icon_url`
- **Channels:** `id`, `guild_id`, `name`, `type` (text/voice), `position`
- **Members:** `user_id`, `guild_id`, `roles`, `joined_at`

### B. Message Store (NoSQL - MongoDB/ScyllaDB)
Discord uses "Bucketing" to keep messages from the same channel together.
- **Messages:**
  - `channel_id` (Partition Key)
  - `message_id` (Snowflake ID - Sort Key)
  - `author_id`
  - `content`
  - `attachments`
  - `timestamp`

## 3. Key Feature Implementations

### A. Snowflake ID Generation
Implement a custom ID generator similar to Discord's Snowflake to ensure IDs are unique, time-sortable, and distributed.
- 42 bits for timestamp (ms since epoch)
- 5 bits for worker ID
- 5 bits for process ID
- 12 bits for sequence number

### B. Real-time Gateway (WebSockets)
The "Gateway" handles all real-time events.
- **Heartbeating:** Clients send periodic pings to maintain connection.
- **Presence:** Redis stores `user_id -> status` (online, idle, dnd, offline).
- **Event Dispatching:** When a message is sent, the server identifies all members of the channel/guild and broadcasts the event.

### C. Permissions System
A bitwise permission system for efficiency.
- `READ_MESSAGES = 1 << 0`
- `SEND_MESSAGES = 1 << 1`
- `MANAGE_MESSAGES = 1 << 2`
- Check permissions at the API and Gateway levels.

## 4. Scalability Strategy (The "Discord Way")

1.  **Request Coalescing:** Implement a "Data Service" (similar to Discord's Rust layer) between the API and Database to prevent "Hot Partitions" (e.g., a viral message in a large server).
2.  **Sharding:**
    - **Database Sharding:** Shard messages by `channel_id`.
    - **Gateway Sharding:** Distribute WebSocket connections across multiple server nodes using a Load Balancer with sticky sessions.
3.  **Caching:** Use Redis to cache the "Ready Payload" (the initial data a client needs when they open the app).

## 5. Development Roadmap

### Phase 1: Foundation (COMPLETED)
- [x] Set up Express + TypeScript boilerplate.
- [x] Implement User Auth (Sessions/Passport).
- [x] Initialize MongoDB for metadata storage.
- [x] Create basic CRUD for Guilds and Channels.

### Phase 2: Real-time & Messaging (IN PROGRESS)
- [x] Integrate Gateway (WebSockets).
- [x] Implement Snowflake ID generator.
- [x] Build the message sending/receiving flow.
- [x] Migrate Message Store to Astra DB (Cassandra).
- [ ] Basic presence system (Online/Offline).

### Phase 3: Advanced Features
- [ ] Permissions & Roles system.
- [ ] File attachments (S3 Integration).
- [ ] Message history (pagination/infinite scroll).
- [ ] Read states (unread indicators).

### Phase 4: Scaling
- [ ] Redis for session management and presence.
- [ ] Message bucketing/sharding logic (Cassandra Partitions).
- [ ] Optimization of the "Ready" event payload.
