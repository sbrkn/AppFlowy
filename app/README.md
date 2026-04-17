# AppFlowy PWA – Next.js + Firebase + Google Drive Starter Kit

A production-ready Progressive Web App starter kit inspired by AppFlowy's collaborative workspace features. Built with **Next.js 14+**, **Tailwind CSS**, **Shadcn UI**, **Firebase**, and **Google Drive** integration.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔐 **Authentication** | Firebase Auth (Email/Password + Google OAuth 2.0) |
| 📄 **Documents** | Create, edit, search, trash/archive documents |
| 📁 **Projects** | Organize documents into projects with tags |
| 🔄 **Real-time sync** | Firestore real-time listeners + offline queue |
| ☁️ **Google Drive** | File backup, upload, download, folder management |
| 📱 **PWA** | Service Worker, Web App Manifest, offline support, push notifications |
| 🎨 **UI** | Shadcn UI components, dark/light mode, responsive layout |
| 🔒 **Security** | JWT sessions, RBAC, HTTP security headers, CORS protection |

---

## 🗂 Project Structure

```
app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public auth pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/              # Protected workspace
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Workspace home
│   │   ├── documents/
│   │   │   ├── page.tsx          # Documents list
│   │   │   └── [id]/page.tsx     # Document editor
│   │   ├── projects/page.tsx     # Projects view
│   │   └── settings/page.tsx     # User settings
│   ├── api/
│   │   ├── auth/route.ts         # Session management
│   │   ├── documents/
│   │   │   ├── route.ts          # List / create documents
│   │   │   └── [id]/route.ts     # Get / update / delete
│   │   └── sync/route.ts         # Offline sync endpoint
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Tailwind + CSS variables
├── components/
│   ├── auth/                     # LoginForm, SignupForm, AuthProvider
│   ├── workspace/                # WorkspaceHome, DocumentsList, ProjectsList, Settings
│   ├── editor/                   # DocumentEditor (rich text)
│   ├── sidebar/                  # Sidebar navigation
│   └── ui/                       # Shadcn UI primitives
├── lib/
│   ├── firebase/                 # Firebase client + admin + auth helpers
│   ├── google-drive/             # Drive API client
│   ├── hooks/                    # useAuth, useDocuments, useSearch, useOnlineStatus
│   └── utils/                    # cn, formatDate, debounce, etc.
├── services/
│   ├── firestore.service.ts      # Firestore CRUD + real-time subscriptions
│   ├── google-drive.service.ts   # Drive backup / restore / upload
│   └── sync.service.ts           # Offline queue + background sync
├── types/index.ts                # All TypeScript types
├── middleware.ts                 # Route protection
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── service-worker.js         # Custom Service Worker
│   └── offline.html              # Offline fallback page
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── .eslintrc.json
├── .prettierrc
└── .env.local.example
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Navigate to the app directory
cd app

# Install dependencies
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password + Google providers
4. Create a **Firestore** database (start in test mode)
5. Enable **Storage**
6. Generate a **Service Account** key: Project Settings → Service Accounts → Generate new private key

### 3. Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Drive API**
3. Create OAuth 2.0 credentials (Web application type)
4. Add `http://localhost:3000/api/auth/google/callback` to authorized redirect URIs

### 4. Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Fill in your values
```

Required variables:

```env
# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# JWT
JWT_SECRET=your-secret-key-min-32-chars
```

### 5. Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🏗 Firestore Data Models

### Users

```
users/{userId}
  email: string
  displayName: string | null
  photoURL: string | null
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  preferences: { theme, language, notificationsEnabled, autoSave, defaultView }
  createdAt: Timestamp
  updatedAt: Timestamp
```

### Documents

```
documents/{documentId}
  workspaceId: string
  title: string
  content: { type: 'doc', content: ContentBlock[] }
  tags: string[]
  authorId: string
  collaborators: string[]
  parentId: string | null
  isArchived: boolean
  isTrashed: boolean
  isPublic: boolean
  version: number
  lastEditedBy: string
  googleDriveFileId: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
```

### Projects

```
projects/{projectId}
  workspaceId: string
  name: string
  description: string | null
  color: string
  status: 'active' | 'completed' | 'on_hold' | 'archived'
  ownerId: string
  members: string[]
  tags: string[]
  documentIds: string[]
  isArchived: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
```

---

## 📱 PWA Installation

The app is installable on desktop and mobile. Users see the "Add to Home Screen" prompt automatically.

For production, run:
```bash
npm run build && npm run start
```

---

## 🔧 Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run format           # Prettier
npm run type-check       # TypeScript check
npm run firebase:deploy  # Deploy to Firebase Hosting
npm run firebase:emulators  # Start Firebase emulators
```

---

## 🔒 Security Features

- **JWT httpOnly cookies** for session management
- **Firebase Admin SDK** for server-side token verification
- **Firestore Security Rules** (apply separately in Firebase Console)
- **Security headers** via `next.config.ts` (CSP, X-Frame-Options, etc.)
- **Route protection** via `middleware.ts`
- **Input validation** with Zod
- **RBAC** via Firestore user roles

---

## 🌐 Google Drive Integration

The `GoogleDriveService` provides:

```typescript
import { GoogleDriveService } from '@/services/google-drive.service';

const driveService = new GoogleDriveService(accessToken);

// Backup a document
await driveService.backupDocument(document);

// Backup entire workspace
await driveService.backupWorkspace(workspaceId, documents);

// Restore from Drive
const doc = await driveService.restoreDocument(driveFileId);

// Upload attachment
const file = await driveService.uploadAttachment(file);

// List backups
const backups = await driveService.listBackups();
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| Backend | Firebase (Auth, Firestore, Storage) |
| Cloud Storage | Google Drive API |
| PWA | Service Worker + Web App Manifest |
| State | React Context + custom hooks |
| Notifications | react-hot-toast |
| Validation | Zod |
| Auth | Firebase Auth + JWT |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push and open a Pull Request

---

## 📄 License

MIT – see [LICENSE](../LICENSE)
