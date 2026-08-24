import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  async list(): Promise<User[]> {
    const res = await firstValueFrom(this.http.get<{ users: User[] }>('/api/users'));
    return res.users;
  }
}
