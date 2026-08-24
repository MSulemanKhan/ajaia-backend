import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../core/services/document.service';
import { UserService } from '../../core/services/user.service';
import { Permission, ShareEntry, User } from '../../core/models';

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './share-dialog.component.html',
  styleUrl: './share-dialog.component.scss'
})
export class ShareDialogComponent implements OnInit {
  readonly documentId = input.required<string>();
  readonly shares = input<ShareEntry[]>([]);
  readonly closed = output<void>();
  readonly sharesChanged = output<ShareEntry[]>();

  readonly localShares = signal<ShareEntry[]>([]);
  readonly users = signal<User[]>([]);
  readonly selectedUsername = signal('');
  readonly permission = signal<Permission>('edit');
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly linkCopied = signal(false);

  readonly documentLink = computed(() => `${location.origin}/documents/${this.documentId()}`);

  constructor(private documentService: DocumentService, private userService: UserService) {}

  async ngOnInit(): Promise<void> {
    this.localShares.set(this.shares());
    try {
      const users = await this.userService.list();
      this.users.set(users);
      if (users.length) this.selectedUsername.set(users[0].username);
    } catch {
      this.error.set('Could not load the list of users.');
    }
  }

  async share(): Promise<void> {
    if (!this.selectedUsername()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      const shares = await this.documentService.share(this.documentId(), this.selectedUsername(), this.permission());
      this.localShares.set(shares);
      this.sharesChanged.emit(shares);
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Could not share this document.');
    } finally {
      this.submitting.set(false);
    }
  }

  async revoke(userId: string): Promise<void> {
    this.error.set('');
    try {
      const shares = await this.documentService.revokeShare(this.documentId(), userId);
      this.localShares.set(shares);
      this.sharesChanged.emit(shares);
    } catch {
      this.error.set('Could not revoke access.');
    }
  }

  async copyLink(): Promise<void> {
    const link = this.documentLink();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    } catch {
      this.error.set('Could not copy the link — you can select and copy it manually.');
    }
  }

  close(): void {
    this.closed.emit();
  }
}
