MASTER PLAN - LOCAL DEVELOPMENT SETUP GUIDE

This guide will help you set up the Master Plan application for local development in VS Code or your preferred IDE.

PREREQUISITES
-------------
- Node.js (v16 or later)
- npm or yarn
- A code editor (VS Code recommended)
- Firebase account (for authentication)
- OpenAI API key (for AI features)

SETUP STEPS
-----------

1. EXPORT THE PROJECT
   First, download all project files from Replit or copy them to your local machine.

2. CREATE A NEW LOCAL PROJECT
   Create a new directory for your project:
   mkdir master-plan
   cd master-plan

3. COPY FILES
   Copy all the following directories and files from the Replit project:
   - /client
   - /server
   - /shared
   - /attached_assets

4. CREATE CONFIGURATION FILES

   package.json:
   ------------
   {
     "name": "master-plan",
     "version": "1.0.0",
     "type": "module",
     "license": "MIT",
     "scripts": {
       "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
       "dev:client": "vite client",
       "dev:server": "tsx server/index.ts",
       "build": "vite build client && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
       "start": "NODE_ENV=production node dist/index.js"
     },
     "dependencies": {
       "@hookform/resolvers": "^3.9.1",
       "@neondatabase/serverless": "^0.10.4",
       "@radix-ui/react-accordion": "^1.2.1",
       "@radix-ui/react-alert-dialog": "^1.1.2",
       "@radix-ui/react-aspect-ratio": "^1.1.0",
       "@radix-ui/react-avatar": "^1.1.1",
       "@radix-ui/react-checkbox": "^1.1.2",
       "@radix-ui/react-collapsible": "^1.1.1",
       "@radix-ui/react-context-menu": "^2.2.2",
       "@radix-ui/react-dialog": "^1.1.2",
       "@radix-ui/react-dropdown-menu": "^2.1.2",
       "@radix-ui/react-hover-card": "^1.1.2",
       "@radix-ui/react-label": "^2.1.0",
       "@radix-ui/react-menubar": "^1.1.2",
       "@radix-ui/react-navigation-menu": "^1.2.1",
       "@radix-ui/react-popover": "^1.1.2",
       "@radix-ui/react-progress": "^1.1.0",
       "@radix-ui/react-radio-group": "^1.2.1",
       "@radix-ui/react-scroll-area": "^1.2.0",
       "@radix-ui/react-select": "^2.1.2",
       "@radix-ui/react-separator": "^1.1.0",
       "@radix-ui/react-slider": "^1.2.1",
       "@radix-ui/react-slot": "^1.1.0",
       "@radix-ui/react-switch": "^1.1.1",
       "@radix-ui/react-tabs": "^1.1.1",
       "@radix-ui/react-toast": "^1.2.2",
       "@radix-ui/react-toggle": "^1.1.0",
       "@radix-ui/react-toggle-group": "^1.1.0",
       "@radix-ui/react-tooltip": "^1.1.3",
       "@tanstack/react-query": "^5.60.5",
       "class-variance-authority": "^0.7.0",
       "clsx": "^2.1.1",
       "cmdk": "^1.0.0",
       "connect-pg-simple": "^10.0.0",
       "date-fns": "^3.6.0",
       "drizzle-orm": "^0.39.1",
       "drizzle-zod": "^0.7.0",
       "embla-carousel-react": "^8.3.0",
       "express": "^4.21.2",
       "express-session": "^1.18.1",
       "firebase": "^11.6.0",
       "firebase-admin": "^13.2.0",
       "framer-motion": "^11.18.2",
       "input-otp": "^1.2.4",
       "lucide-react": "^0.453.0",
       "memorystore": "^1.6.7",
       "openai": "^4.91.0",
       "passport": "^0.7.0",
       "passport-local": "^1.0.0",
       "react": "^18.3.1",
       "react-day-picker": "^8.10.1",
       "react-dom": "^18.3.1",
       "react-hook-form": "^7.53.1",
       "react-icons": "^5.4.0",
       "react-resizable-panels": "^2.1.4",
       "recharts": "^2.15.1",
       "tailwind-merge": "^2.5.4",
       "tailwindcss-animate": "^1.0.7",
       "tesseract.js": "^6.0.0",
       "vaul": "^1.1.0",
       "wouter": "^3.3.5",
       "ws": "^8.18.0",
       "zod": "^3.23.8",
       "zod-validation-error": "^3.4.0"
     },
     "devDependencies": {
       "@tailwindcss/typography": "^0.5.15",
       "@types/connect-pg-simple": "^7.0.3",
       "@types/express": "4.17.21",
       "@types/express-session": "^1.18.0",
       "@types/node": "20.16.11",
       "@types/passport": "^1.0.16",
       "@types/passport-local": "^1.0.38",
       "@types/react": "^18.3.11",
       "@types/react-dom": "^18.3.1",
       "@types/ws": "^8.5.13",
       "@vitejs/plugin-react": "^4.3.2",
       "autoprefixer": "^10.4.20",
       "concurrently": "^8.2.2",
       "drizzle-kit": "^0.30.4",
       "esbuild": "^0.25.0",
       "postcss": "^8.4.47",
       "tailwindcss": "^3.4.14",
       "tsx": "^4.19.1",
       "typescript": "5.6.3",
       "vite": "^5.4.14"
     }
   }

   vite.config.ts:
   --------------
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   import path from "path";
   import { fileURLToPath } from "url";
   
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   
   export default defineConfig({
     plugins: [
       react(),
     ],
     resolve: {
       alias: {
         "@": path.resolve(__dirname, "client", "src"),
         "@shared": path.resolve(__dirname, "shared"),
         "@assets": path.resolve(__dirname, "attached_assets"),
       },
     },
     server: {
       proxy: {
         '/api': {
           target: 'http://localhost:5000',
           changeOrigin: true
         }
       }
     },
     build: {
       outDir: path.resolve(__dirname, "dist/public"),
       emptyOutDir: true,
     },
   });

   .env file:
   ---------
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   OPENAI_API_KEY=your_openai_api_key

5. SERVER MODIFICATIONS
   Modify the server/index.ts file to ensure it uses a standard port:

   // Add at the end of the file or modify the existing listen call
   const PORT = process.env.PORT || 5000;
   server.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });

6. INSTALL DEPENDENCIES
   Run:
   npm install
   
   Or if you use yarn:
   yarn install

7. START THE APPLICATION
   Start both the client and server:
   npm run dev
   
   Or start them separately:
   # Terminal 1 - Frontend
   npm run dev:client
   
   # Terminal 2 - Backend
   npm run dev:server

FIREBASE AUTHENTICATION SETUP
----------------------------
1. Go to the Firebase Console (https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Add a web app to your project
4. Enable Google Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google provider
5. Add your local development URL to authorized domains:
   - Go to Authentication > Settings > Authorized domains
   - Add `localhost`
6. Copy the Firebase configuration to your .env file

TROUBLESHOOTING
--------------
Common Issues:

1. Module not found errors:
   - Check that all paths in package.json, vite.config.ts, and tsconfig.json are correct.
   - Verify all dependencies are installed.

2. Firebase authentication errors:
   - Ensure your Firebase project is properly configured.
   - Check that all required environment variables are set.

3. API connection issues:
   - Verify the backend server is running on port 5000.
   - Check that the Vite proxy configuration is correct.

4. OpenAI API errors:
   - Ensure your OpenAI API key is valid and properly set in the .env file.

5. Port conflicts:
   - If ports are already in use, modify the port numbers in the server and Vite configuration.

PROJECT STRUCTURE
---------------
Here's an overview of the project structure for reference:

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
└── attached_assets/       # Assets and attachments

FEATURES OVERVIEW
---------------
- User Authentication: Firebase-based authentication with role-based access
- Dashboard: Role-specific dashboards for teachers, students, principals, admins, and parents
- Student Directory: Browse students organized by standards from nursery to 12th grade
- AI Features: AI tutoring, test generation, answer evaluation using OpenAI
- Analytics: Performance tracking and data visualization
- Test Management: Create, distribute, and evaluate tests
- OCR Scanning: Convert physical tests to digital format