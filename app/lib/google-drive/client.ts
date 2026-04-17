import type { DriveFile, DriveFolder, DriveUploadOptions, DriveTokens } from '@/types';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const APPFLOWY_FOLDER_NAME = 'AppFlowy Backups';

export class GoogleDriveClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Google Drive API error ${response.status}: ${error?.error?.message ?? response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /** List files in a folder (defaults to root) */
  async listFiles(folderId = 'root', pageToken?: string): Promise<{
    files: DriveFile[];
    nextPageToken?: string;
  }> {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, parents, thumbnailLink)',
      pageSize: '50',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const data = await this.fetch<{ files: DriveFile[]; nextPageToken?: string }>(
      `${DRIVE_API_BASE}/files?${params}`
    );
    return data;
  }

  /** Get or create the AppFlowy backup folder */
  async getOrCreateAppFolder(): Promise<string> {
    const params = new URLSearchParams({
      q: `name='${APPFLOWY_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    const { files } = await this.fetch<{ files: DriveFolder[] }>(
      `${DRIVE_API_BASE}/files?${params}`
    );

    if (files.length > 0) return files[0].id;

    // Create the folder
    const folder = await this.fetch<{ id: string }>(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      body: JSON.stringify({
        name: APPFLOWY_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    return folder.id;
  }

  /** Upload a file to Google Drive */
  async uploadFile(options: DriveUploadOptions): Promise<DriveFile> {
    const metadata: Record<string, unknown> = {
      name: options.name,
      mimeType: options.mimeType,
    };

    if (options.folderId) {
      metadata.parents = [options.folderId];
    }

    // Multipart upload
    const boundary = '-------appflowy_boundary';
    const contentType = `multipart/related; boundary="${boundary}"`;

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${options.mimeType}\r\n\r\n` +
      `${typeof options.content === 'string' ? options.content : await options.content.text()}\r\n` +
      `--${boundary}--`;

    const response = await fetch(
      `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,iconLink,parents`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': contentType,
        },
        body,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${error?.error?.message ?? response.statusText}`);
    }

    return response.json() as Promise<DriveFile>;
  }

  /** Download file content */
  async downloadFile(fileId: string): Promise<string> {
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.text();
  }

  /** Delete a file */
  async deleteFile(fileId: string): Promise<void> {
    await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
  }

  /** Update file content (patch) */
  async updateFile(fileId: string, content: string, mimeType: string): Promise<DriveFile> {
    const response = await fetch(
      `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media&fields=id,name,mimeType,size,modifiedTime`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': mimeType,
        },
        body: content,
      }
    );

    if (!response.ok) {
      throw new Error(`Update failed: ${response.statusText}`);
    }

    return response.json() as Promise<DriveFile>;
  }

  /** Search files by name */
  async searchFiles(query: string): Promise<DriveFile[]> {
    const params = new URLSearchParams({
      q: `name contains '${query}' and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, parents)',
      pageSize: '20',
    });

    const { files } = await this.fetch<{ files: DriveFile[] }>(
      `${DRIVE_API_BASE}/files?${params}`
    );
    return files;
  }
}

/** Exchange authorization code for Drive tokens (server-side) */
export async function exchangeCodeForTokens(code: string): Promise<DriveTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange authorization code for tokens');
  }

  return response.json() as Promise<DriveTokens>;
}

/** Refresh an expired access token */
export async function refreshAccessToken(refreshToken: string): Promise<DriveTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  return response.json() as Promise<DriveTokens>;
}

/** Build the Google OAuth authorization URL */
export function getAuthorizationUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? '',
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });

  if (state) params.set('state', state);

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
