import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { DocumentService } from '../../core/services/document.service';
import { DocumentDetail, ShareEntry } from '../../core/models';
import { RichTextEditorComponent } from '../../shared/rich-text-editor/rich-text-editor.component';
import { ShareDialogComponent } from '../share-dialog/share-dialog.component';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RichTextEditorComponent, ShareDialogComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private documents = inject(DocumentService);

  readonly doc = signal<DocumentDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly saveState = signal<SaveState>('idle');
  readonly shareOpen = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: [''],
    content: ['']
  });

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      if (id) this.load(id);
    });

    this.form.valueChanges.pipe(debounceTime(800), takeUntil(this.destroy$)).subscribe(() => {
      const current = this.doc();
      if (!this.loading() && current && current.accessLevel !== 'view') {
        this.save();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const doc = await this.documents.get(id);
      this.doc.set(doc);
      this.form.setValue({ title: doc.title, content: doc.contentHtml }, { emitEvent: false });
      if (doc.accessLevel === 'view') this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    } catch (err: any) {
      this.error.set(
        err?.status === 403 || err?.status === 404
          ? "You don't have access to this document."
          : 'Could not load this document.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async save(): Promise<void> {
    const current = this.doc();
    if (!current) return;
    const { title, content } = this.form.getRawValue();
    this.saveState.set('saving');
    try {
      const updated = await this.documents.update(current.id, {
        title: title.trim() || 'Untitled document',
        contentHtml: content
      });
      this.doc.set({ ...current, title: updated.title, updatedAt: updated.updatedAt, contentHtml: updated.contentHtml });
      this.saveState.set('saved');
    } catch {
      this.saveState.set('error');
    }
  }

  onSharesChanged(shares: ShareEntry[]): void {
    const current = this.doc();
    if (current) this.doc.set({ ...current, shares });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
