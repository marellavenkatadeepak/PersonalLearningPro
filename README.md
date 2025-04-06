# Master Plan - AI-Powered Personalized Learning Platform

An AI-powered personalized learning platform designed to enhance educational experiences through intelligent test creation, comprehensive performance analytics, and adaptive learning tools for both students and teachers.

## Project Overview

This educational platform integrates AI capabilities to deliver customized learning experiences, evaluate student responses, generate study plans, and analyze test performance data. The app includes features like:

- AI-driven tutoring and concept explanation
- Adaptive test generation and evaluation
- Teacher dashboard with class management
- Performance tracking and analytics
- Responsive web application with modern UI
- Student directory organized by standards

## Requirements

- Node.js v16+
- npm or yarn
- Firebase project (for authentication)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd master-plan
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Firebase Authentication

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Google authentication in the Firebase console
3. Create a `.env` file in the root directory with the following variables:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
OPENAI_API_KEY=your_openai_api_key
```

### 4. Start the Development Server

Run both the frontend and backend in development mode:

```bash
# Run server and client concurrently (requires concurrently package)
npm run dev

# OR run them separately in two terminals:
# Terminal 1 - Frontend
npm run dev:client

# Terminal 2 - Backend
npm run dev:server
```

The application will be available at:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5000](http://localhost:5000)

## Project Structure

```
├── client/                # Frontend code
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions & libraries
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Entry point
│   └── index.html         # HTML template
├── server/                # Backend code
│   ├── lib/               # Server utilities
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage interface
│   └── vite.ts            # Server setup for Vite
├── shared/                # Shared code between client and server
│   └── schema.ts          # Database schema definitions
└── various config files   # (package.json, tsconfig.json, etc.)
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:client` - Start only frontend in development mode
- `npm run dev:server` - Start only backend in development mode
- `npm run build` - Build the application for production
- `npm run start` - Start the production build
- `npm run check` - Type-check the TypeScript code
- `npm run db:push` - Push schema changes to the database

## User Roles

The application supports multiple user roles:

- **Teacher**: Create tests, scan physical tests, view analytics, manage students
- **Student**: Take tests, view progress, use AI tutor, join live classes
- **Principal**: Oversee institution, staff, students, and analytics
- **Admin**: Manage users, institutions, classes, and system settings
- **Parent**: Monitor child's academic progress, view test results, schedule teacher meetings

## Features

### AI-Powered Capabilities
- **AI Tutor**: Interactive learning assistant with chat-based help
- **Test Creation**: AI-assisted question generation
- **Answer Evaluation**: Automatic evaluation of subjective answers
- **Performance Analysis**: AI insights into student performance patterns

### Core Functionality
- **User Management**: Role-based access control
- **Test Management**: Create, distribute, and evaluate tests
- **OCR Test Scanning**: Convert physical test papers to digital format
- **Student Directory**: Browse students organized by standards (nursery to 12th grade)
- **Analytics Dashboard**: Visual representation of performance metrics
- **Learning Progress Tracking**: Monitor improvement over time

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request