import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LocalStorageService } from './shared/services/local-storage.service';

@Injectable({providedIn: 'root',})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router, private localStorageService: LocalStorageService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.localStorageService.clear();
          this.router.navigate(['/']);
        }
        return throwError(() => error); 
      })
    );
  }
}
