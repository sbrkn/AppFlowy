import { GoogleDriveClient } from '@/lib/google-drive/client';
import { firestoreService } from './firestore.service';
import type { Document, DriveFile } from '@/types';

export class GoogleDriveService {
  private client: GoogleDriveClient;
  private appFolderId: string | null = null;

  constructor(accessToken: string) {
    this.client = new GoogleDriveClient(accessToken);
  }

  private async getAppFolderId(): Promise<string> {
    if (!this.appFolderId) {
      this.appFolderId = await this.client.getOrCreateAppFolder();
    }
    return this.appFolderId;
  }

  /** Back up a single document to Google Drive */
  async backupDocument(document: Document): Promise<string> {
    const folderId = await this.getAppFolderId();
    const content = JSON.stringify(document, null, 2);
    const fileName = `${document.id}_${document.title.replace(/\s+/g, '_')}.json`;

    let file: DriveFile;

    if (document.googleDriveFileId) {
      // Update existing Drive file
      file = await this.client.updateFile(
        document.googleDriveFileId,
        content,
        'application/json'
      );
    } else {
      // Create new Drive file
      file = await this.client.uploadFile({
        name: fileName,
        mimeType: 'application/json',
        folderId,
        content,
      });

      // Save Drive file ID to Firestore
      await firestoreService.updateDocument(document.id, {
        googleDriveFileId: file.id,
      });
    }

    return file.id;
  }

  /** Back up all documents in a workspace */
  async backupWorkspace(workspaceId: string, documents: Document[]): Promise<{
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const results = { succeeded: 0, failed: 0, errors: [] as string[] };

    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < documents.length; i += 5) {
      const batch = documents.slice(i, i + 5);
      await Promise.allSettled(
        batch.map(async (doc) => {
          try {
            await this.backupDocument(doc);
            results.succeeded++;
          } catch (err) {
            results.failed++;
            results.errors.push(`${doc.title}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        })
      );
    }

    return results;
  }

  /** Restore a document from Google Drive */
  async restoreDocument(driveFileId: string): Promise<Document | null> {
    try {
      const content = await this.client.downloadFile(driveFileId);
      return JSON.parse(content) as Document;
    } catch {
      return null;
    }
  }

  /** List backup files in the AppFlowy folder */
  async listBackups(): Promise<DriveFile[]> {
    const folderId = await this.getAppFolderId();
    const { files } = await this.client.listFiles(folderId);
    return files;
  }

  /** Upload a binary file (image, attachment) to Drive */
  async uploadAttachment(file: File, folderId?: string): Promise<DriveFile> {
    const targetFolder = folderId ?? (await this.getAppFolderId());
    return this.client.uploadFile({
      name: file.name,
      mimeType: file.type,
      folderId: targetFolder,
      content: file,
    });
  }

  /** List all Drive files (for file picker) */
  async listFiles(folderId?: string, pageToken?: string) {
    return this.client.listFiles(folderId, pageToken);
  }

  /** Search Drive files */
  async searchFiles(query: string) {
    return this.client.searchFiles(query);
  }
}
