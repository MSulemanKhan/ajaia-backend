import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly error = signal('');
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    displayName: ['']
  });

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.error.set('');
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password, displayName } = this.form.getRawValue();
    this.error.set('');
    this.loading.set(true);
    try {
      if (this.mode() === 'login') {
        await this.auth.login(username, password);
      } else {
        await this.auth.register(username, password, displayName);
      }
      this.router.navigateByUrl('/dashboard');
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Something went wrong. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async quickLogin(username: string): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.login(username, 'password123');
      this.router.navigateByUrl('/dashboard');
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Could not log in with the demo account.');
    } finally {
      this.loading.set(false);
    }
  }
}
