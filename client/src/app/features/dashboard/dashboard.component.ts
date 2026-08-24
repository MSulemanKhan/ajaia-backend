import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { DocumentSummary } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private documents = inject(DocumentService);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly owned = signal<DocumentSummary[]>([]);
  readonly shared = signal<DocumentSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly creating = signal(false);
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly currentUser = this.auth.currentUser;

  ngOnInit(): void {
    this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await this.documents.list();
      this.owned.set(res.owned);
      this.shared.set(res.shared);
    } catch {
      this.error.set('Could not load your documents.');
    } finally {
      this.loading.set(false);
    }
  }

  async createDocument(): Promise<void> {
    this.creating.set(true);
    this.error.set('');
    try {
      const doc = await this.documents.create('Untitled document');
      this.router.navigate(['/documents', doc.id]);
    } catch {
      this.error.set('Could not create a new document.');
      this.creating.set(false);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.uploadError.set('');
    try {
      const doc = await this.documents.upload(file);
      this.router.navigate(['/documents', doc.id]);
    } catch (err: any) {
      this.uploadError.set(err?.error?.error || 'Could not import that file.');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
