import { User, Message, Conversation, UserRole } from '@/types/chat';

// ─── Mock Users ────────────────────────────────────────────────────────────────

export const mockUsers: Record<string, User> = {
    'student-me': { id: 'student-me', name: 'Arjun Sharma', role: 'student', isOnline: true },
    'teacher-1': { id: 'teacher-1', name: 'Mr. Ramesh Gupta', role: 'teacher', subject: 'Mathematics', isOnline: true },
    'teacher-2': { id: 'teacher-2', name: 'Ms. Priya Iyer', role: 'teacher', subject: 'Science', isOnline: false, lastSeen: new Date(Date.now() - 15 * 60000) },
    'teacher-3': { id: 'teacher-3', name: 'Mrs. Kavitha Nair', role: 'teacher', subject: 'English', isOnline: false, lastSeen: new Date(Date.now() - 40 * 60000) },
    'parent-1': { id: 'parent-1', name: 'Mrs. Anita Sharma', role: 'parent', isOnline: true },
    'parent-2': { id: 'parent-2', name: 'Mr. Suresh Verma', role: 'parent', isOnline: false, lastSeen: new Date(Date.now() - 2 * 3600000) },
    'student-2': { id: 'student-2', name: 'Priya Patel', role: 'student', isOnline: true },
    'student-3': { id: 'student-3', name: 'Rohit Mehta', role: 'student', isOnline: false, lastSeen: new Date(Date.now() - 30 * 60000) },
    'teacher-me': { id: 'teacher-me', name: 'Mr. Ramesh Gupta', role: 'teacher', subject: 'Mathematics', isOnline: true },
    'parent-me': { id: 'parent-me', name: 'Mrs. Anita Sharma', role: 'parent', isOnline: true },
};

// ─── Mock Messages ─────────────────────────────────────────────────────────────

function msg(id: string, conversationId: string, senderId: string, senderRole: UserRole, content: string, minutesAgo: number, extra: Partial<Message> = {}): Message {
    return {
        id, conversationId, senderId, senderRole, content,
        type: extra.type || 'text',
        status: 'read',
        timestamp: new Date(Date.now() - minutesAgo * 60000),
        deliveredTo: [],
        readBy: [],
        ...extra,
    };
}

export const mockMessages: Record<string, Message[]> = {
    'conv-announcements': [
        msg('m1', 'conv-announcements', 'teacher-1', 'teacher', '📢 School Annual Day is on March 15th. All students must participate in at least one event.', 120, { type: 'announcement' }),
        msg('m2', 'conv-announcements', 'teacher-2', 'teacher', '📘 Mid-term exam schedule has been posted. Please check the notice board.', 60, { type: 'announcement' }),
        msg('m3', 'conv-announcements', 'teacher-1', 'teacher', 'Reminder: Parent-teacher meeting this Saturday from 10 AM to 1 PM.', 30),
    ],
    'conv-math': [
        msg('m4', 'conv-math', 'teacher-1', 'teacher', 'Today we covered Integration by Parts. Please solve exercises 12.1 to 12.5.', 90),
        msg('m5', 'conv-math', 'student-me', 'student', 'Sir, I have a doubt about question 12.3. How do we apply the formula when the limits are infinite?', 45, { type: 'doubt' }),
        msg('m6', 'conv-math', 'teacher-1', 'teacher', 'Great question! When limits are infinite, you convert to a limit and evaluate. I will show this in class tomorrow.', 40, { isDoubtAnswered: true }),
        msg('m7', 'conv-math', 'student-me', 'student', 'Thank you sir! That makes sense.', 35),
    ],
    'conv-science': [
        msg('m8', 'conv-science', 'teacher-2', 'teacher', 'Lab assignment: Write a report on Newton\'s laws of motion with real-life examples. Due next Friday.', 180, {
            type: 'assignment',
            assignmentData: { title: "Newton's Laws Report", dueDate: new Date(Date.now() + 7 * 86400000), subject: 'Science' },
        }),
        msg('m9', 'conv-science', 'student-2', 'student', 'Ma\'am, can we include examples from sports?', 60),
        msg('m10', 'conv-science', 'teacher-2', 'teacher', 'Yes, absolutely! Sports examples are excellent for Newton\'s laws.', 55),
    ],
    'conv-teacher-math': [
        msg('m11', 'conv-teacher-math', 'student-me', 'student', 'Sir, I scored 78/100 in the last test. Can you suggest what to focus on?', 120),
        msg('m12', 'conv-teacher-math', 'teacher-1', 'teacher', 'Arjun, focus on Integration and Probability. Those had the most marks. I can schedule extra sessions.', 115),
        msg('m13', 'conv-teacher-math', 'student-me', 'student', 'That would be very helpful, sir. Thank you!', 110),
    ],
    'conv-friends': [
        msg('m14', 'conv-friends', 'student-2', 'student', 'Hey! Did you finish the science assignment?', 30),
        msg('m15', 'conv-friends', 'student-me', 'student', 'Almost done! The Newton examples were tricky. You?', 25),
        msg('m16', 'conv-friends', 'student-2', 'student', 'Same 😅 Let\'s study together tomorrow?', 20),
        msg('m17', 'conv-friends', 'student-me', 'student', 'Sure! Library at 4 PM?', 10),
    ],
    // Teacher's view conversations
    'conv-teacher-announcements': [
        msg('tm1', 'conv-teacher-announcements', 'teacher-me', 'teacher', 'Reminder to all staff: Department meeting on Thursday at 3 PM in the conference room.', 90, { type: 'announcement' }),
        msg('tm2', 'conv-teacher-announcements', 'teacher-me', 'teacher', 'Exam question papers must be submitted by next Monday.', 30, { type: 'announcement' }),
    ],
    'conv-class-teacher': [
        msg('tc1', 'conv-class-teacher', 'teacher-me', 'teacher', 'Class 10-A students, please complete Chapter 12 exercises before Wednesday.', 120),
        msg('tc2', 'conv-class-teacher', 'student-2', 'student', 'Sir, will question 12.6 also be in the test?', 60),
        msg('tc3', 'conv-class-teacher', 'teacher-me', 'teacher', 'Yes, 12.6 is included. Focus on the formula derivation.', 55),
    ],
    'conv-parent-1': [
        msg('tp1', 'conv-parent-1', 'parent-1', 'parent', 'Good afternoon sir. How is Arjun performing in Mathematics?', 180),
        msg('tp2', 'conv-parent-1', 'teacher-me', 'teacher', 'Good afternoon Mrs. Sharma! Arjun is doing well. He scored 78/100 recently and is very participative.', 175),
        msg('tp3', 'conv-parent-1', 'parent-1', 'parent', 'Thank you sir. We will encourage him to improve further.', 170),
    ],
    // Parent view conversations
    'conv-parent-announcements': [
        msg('pa1', 'conv-parent-announcements', 'teacher-1', 'teacher', 'Dear parents, the mid-term results are available on the school portal.', 240, { type: 'announcement' }),
        msg('pa2', 'conv-parent-announcements', 'teacher-2', 'teacher', 'Parent-teacher meeting this Saturday. Please confirm attendance.', 60, { type: 'announcement' }),
    ],
    'conv-parent-math': [
        msg('pm1', 'conv-parent-math', 'parent-me', 'parent', 'Hello sir, can you tell me about Arjun\'s progress?', 300),
        msg('pm2', 'conv-parent-math', 'teacher-1', 'teacher', 'Hello! Arjun is progressing well. He has improved from 65 to 78 in the last two tests.', 290),
        msg('pm3', 'conv-parent-math', 'parent-me', 'parent', 'That\'s great to hear! Thank you.', 280),
    ],
};

// ─── Mock Conversations ────────────────────────────────────────────────────────

const studentConvs: Conversation[] = [
    {
        id: 'conv-announcements', name: 'School Announcements', category: 'announcement',
        isGroup: true, isReadOnly: true, unreadCount: 1,
        participants: [mockUsers['teacher-1'], mockUsers['teacher-2']],
        lastMessage: mockMessages['conv-announcements'][2],
        icon: '📢',
    },
    {
        id: 'conv-math', name: 'Class 10-A · Mathematics', category: 'class',
        isGroup: true, unreadCount: 0, subject: 'Mathematics',
        participants: [mockUsers['teacher-1'], mockUsers['student-2'], mockUsers['student-3']],
        lastMessage: mockMessages['conv-math'][3],
    },
    {
        id: 'conv-science', name: 'Class 10-A · Science', category: 'class',
        isGroup: true, unreadCount: 2, subject: 'Science',
        participants: [mockUsers['teacher-2'], mockUsers['student-2']],
        lastMessage: mockMessages['conv-science'][2],
    },
    {
        id: 'conv-teacher-math', name: 'Mr. Ramesh Gupta', category: 'teacher',
        isGroup: false, unreadCount: 0,
        participants: [mockUsers['teacher-1']],
        lastMessage: mockMessages['conv-teacher-math'][2],
    },
    {
        id: 'conv-friends', name: 'Priya Patel', category: 'friend',
        isGroup: false, unreadCount: 2,
        participants: [mockUsers['student-2']],
        lastMessage: mockMessages['conv-friends'][3],
    },
];

const teacherConvs: Conversation[] = [
    {
        id: 'conv-teacher-announcements', name: 'School Announcements', category: 'announcement',
        isGroup: true, isReadOnly: false, unreadCount: 0,
        participants: [mockUsers['teacher-2'], mockUsers['teacher-3']],
        lastMessage: mockMessages['conv-teacher-announcements'][1],
        icon: '📢',
    },
    {
        id: 'conv-class-teacher', name: 'Class 10-A · Mathematics', category: 'class',
        isGroup: true, unreadCount: 1, subject: 'Mathematics',
        participants: [mockUsers['student-2'], mockUsers['student-3']],
        lastMessage: mockMessages['conv-class-teacher'][2],
    },
    {
        id: 'conv-parent-1', name: 'Mrs. Anita Sharma (Arjun\'s parent)', category: 'parent',
        isGroup: false, unreadCount: 0,
        participants: [mockUsers['parent-1']],
        lastMessage: mockMessages['conv-parent-1'][2],
    },
    {
        id: 'conv-parent-2', name: 'Mr. Suresh Verma (Priya\'s parent)', category: 'parent',
        isGroup: false, unreadCount: 0,
        participants: [mockUsers['parent-2']],
        lastMessage: undefined,
    },
];

const parentConvs: Conversation[] = [
    {
        id: 'conv-parent-announcements', name: 'School Announcements', category: 'announcement',
        isGroup: true, isReadOnly: true, unreadCount: 1,
        participants: [mockUsers['teacher-1'], mockUsers['teacher-2']],
        lastMessage: mockMessages['conv-parent-announcements'][1],
        icon: '📢',
    },
    {
        id: 'conv-parent-math', name: 'Mr. Ramesh Gupta · Mathematics', category: 'teacher',
        isGroup: false, unreadCount: 0,
        participants: [mockUsers['teacher-1']],
        lastMessage: mockMessages['conv-parent-math'][2],
    },
    {
        id: 'conv-parent-science', name: 'Ms. Priya Iyer · Science', category: 'teacher',
        isGroup: false, unreadCount: 1,
        participants: [mockUsers['teacher-2']],
        lastMessage: undefined,
    },
];

export function getConversationsForRole(role: UserRole): Conversation[] {
    if (role === 'teacher') return teacherConvs;
    if (role === 'parent') return parentConvs;
    return studentConvs;
}
