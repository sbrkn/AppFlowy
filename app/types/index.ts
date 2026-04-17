// ==========================================
// User & Auth Types
// ==========================================

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  autoSave: boolean;
  defaultView: 'list' | 'grid' | 'kanban';
}

export interface AuthSession {
  user: User;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ==========================================
// Workspace & Document Types
// ==========================================

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  role: UserRole;
  joinedAt: Date;
}

export interface Document {
  id: string;
  workspaceId: string;
  title: string;
  content: DocumentContent;
  tags: string[];
  authorId: string;
  collaborators: string[];
  parentId: string | null;
  isArchived: boolean;
  isTrashed: boolean;
  isPublic: boolean;
  version: number;
  lastEditedBy: string;
  googleDriveFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentContent {
  type: 'doc';
  content: ContentBlock[];
}

export interface ContentBlock {
  type: BlockType;
  content?: InlineContent[];
  attrs?: Record<string, unknown>;
}

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'listItem'
  | 'codeBlock'
  | 'blockquote'
  | 'horizontalRule'
  | 'image'
  | 'table';

export interface InlineContent {
  type: 'text' | 'hardBreak';
  text?: string;
  marks?: Mark[];
}

export interface Mark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link';
  attrs?: Record<string, unknown>;
}

// ==========================================
// Project Types
// ==========================================

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  status: ProjectStatus;
  ownerId: string;
  members: string[];
  tags: string[];
  documentIds: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived';

// ==========================================
// Tag Types
// ==========================================

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdBy: string;
  createdAt: Date;
}

// ==========================================
// Google Drive Types
// ==========================================

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedTime: string;
  webViewLink: string | null;
  iconLink: string | null;
  parents: string[];
  thumbnailLink: string | null;
}

export interface DriveFolder {
  id: string;
  name: string;
  parents: string[];
  createdTime: string;
  modifiedTime: string;
}

export interface DriveUploadOptions {
  name: string;
  mimeType: string;
  folderId?: string;
  content: Blob | string;
}

export interface DriveTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

// ==========================================
// Sync Types
// ==========================================

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  lastSyncAt: Date | null;
  pendingChanges: number;
  errorMessage: string | null;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ==========================================
// UI State Types
// ==========================================

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data?: Record<string, unknown>;
}

export type ModalType =
  | 'create_document'
  | 'edit_document'
  | 'create_project'
  | 'edit_project'
  | 'create_tag'
  | 'delete_confirm'
  | 'share_document'
  | 'settings';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  children?: SidebarItem[];
  badge?: string | number;
}

// ==========================================
// Search Types
// ==========================================

export interface SearchResult {
  type: 'document' | 'project';
  id: string;
  title: string;
  excerpt: string;
  score: number;
  updatedAt: Date;
}

export interface SearchFilters {
  type?: 'document' | 'project' | 'all';
  tags?: string[];
  dateRange?: { from: Date; to: Date };
  authorId?: string;
}
