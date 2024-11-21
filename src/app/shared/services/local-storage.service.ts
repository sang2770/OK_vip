import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // Service này sẽ được sử dụng toàn cục
})
export class LocalStorageService {
  constructor() {}

  setItem(key: string, value: any): void {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  }

  getItem<T>(key: string): T | null {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
