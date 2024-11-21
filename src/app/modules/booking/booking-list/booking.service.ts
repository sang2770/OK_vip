import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = 'api/order/orders/market?pageSize=5&pageIndex=1&search='; // Replace with your API URL
  constructor(
    private http: HttpClient,
    private storageService: LocalStorageService
  ) {}

  buildHeader() {
    // Khóa mã hóa
    const key = 'blackmythwukong2211@sssddmsseewqrrr';
    return {
      'x-authentication': CryptoJS.AES.encrypt(
        new Date(Date.now()).toISOString(),
        key
      ).toString(),
      authorization: 'Bearer ' + this.storageService.getItem('token'),
    };
  }

  getList(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...this.buildHeader(),
    });

    return this.http.get(this.apiUrl, { headers });
  }

  book(id: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...this.buildHeader(),
    });
    return this.http.put('/api/order/orders/receive/' + id, {}, { headers });
  }
}
