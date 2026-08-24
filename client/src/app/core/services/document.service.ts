import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DocumentDetail, DocumentListResponse, Permission, ShareEntry } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private http: HttpClient) {}

  list(): Promise<DocumentListResponse> {
    return firstValueFrom(this.http.get<DocumentListResponse>('/api/documents'));
  }

  async create(title: string): Promise<DocumentDetail> {
    const res = await firstValueFrom(
      this.http.post<{ document: DocumentDetail }>('/api/documents', { title })
    );
    return res.document;
  }

  async get(id: string): Promise<DocumentDetail> {
    const res = await firstValueFrom(this.http.get<{ document: DocumentDetail }>(`/api/documents/${id}`));
    return res.document;
  }

  async update(id: string, patch: Partial<Pick<DocumentDetail, 'title' | 'contentHtml'>>): Promise<DocumentDetail> {
    const res = await firstValueFrom(
      this.http.put<{ document: DocumentDetail }>(`/api/documents/${id}`, patch)
    );
    return res.document;
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/documents/${id}`));
  }

  async share(id: string, username: string, permission: Permission): Promise<ShareEntry[]> {
    const res = await firstValueFrom(
      this.http.post<{ shares: ShareEntry[] }>(`/api/documents/${id}/share`, { username, permission })
    );
    return res.shares;
  }

  async revokeShare(id: string, userId: string): Promise<ShareEntry[]> {
    const res = await firstValueFrom(
      this.http.delete<{ shares: ShareEntry[] }>(`/api/documents/${id}/share/${userId}`)
    );
    return res.shares;
  }

  async upload(file: File): Promise<DocumentDetail> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await firstValueFrom(
      this.http.post<{ document: DocumentDetail }>('/api/upload', formData)
    );
    return res.document;
  }
}
