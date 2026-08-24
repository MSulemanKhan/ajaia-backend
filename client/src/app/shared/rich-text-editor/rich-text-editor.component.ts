import { Component, ElementRef, SecurityContext, ViewChild, ViewEncapsulation, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss',
  // Content is injected via raw innerHTML (execCommand), so it never receives Angular's
  // emulated-encapsulation attribute — scoped styles would silently fail to match it.
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ]
})
export class RichTextEditorComponent implements ControlValueAccessor {
  @ViewChild('editor', { static: true }) editorRef!: ElementRef<HTMLDivElement>;

  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private sanitizer: DomSanitizer) {}

  writeValue(value: string | null): void {
    if (this.editorRef?.nativeElement) {
      this.editorRef.nativeElement.innerHTML = value || '';
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  exec(command: string, value?: string): void {
    if (this.disabled) return;
    document.execCommand(command, false, value);
    this.editorRef.nativeElement.focus();
    this.emitChange();
  }

  onInput(): void {
    this.emitChange();
  }

  onBlur(): void {
    this.onTouched();
  }

  private emitChange(): void {
    const raw = this.editorRef.nativeElement.innerHTML;
    const safe = this.sanitizer.sanitize(SecurityContext.HTML, raw) ?? '';
    this.onChange(safe);
  }
}
