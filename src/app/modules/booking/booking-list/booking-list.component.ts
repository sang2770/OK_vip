import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { BookingService } from './booking.service';
import {
  Observable,
  Subject,
  catchError,
  filter,
  from,
  interval,
  map,
  mergeMap,
  of,
  switchMap,
  takeUntil,
  tap,
  timeout,
} from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-booking-list',
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.scss',
})
export class BookingListComponent implements OnDestroy {
  username?: string;
  cnt = 0;
  source$ = interval(800);
  stopSubject = new Subject<void>();
  isRunning = false;
  receiveIds = new Set<string>();
  dateFilter: string;
  categories: string[] = ['Trang chủ', 'Guest post'];
  tempCategory: string = '';
  limit = 30;

  constructor(
    private localStorageService: LocalStorageService,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router
  ) {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    this.username = this.localStorageService.getItem('username') ?? '';
    this.categories = this.localStorageService.getItem('categories') ?? [
      'Trang chủ',
      'Guest post',
    ];
    this.dateFilter =
      this.localStorageService.getItem('dateFilter') ??
      now.toISOString().split('T')[0];
    this.limit = this.localStorageService.getItem('limit') ?? 30;
  }
  onChange() {
    this.localStorageService.setItem('dateFilter', this.dateFilter);
    this.localStorageService.setItem('categories', this.categories);
    this.localStorageService.setItem('limit', this.limit);
  }
  ngOnDestroy(): void {
    this.onEnd();
  }

  onLogout() {
    this.localStorageService.removeItem('token');
    this.localStorageService.removeItem('username');
    this.router.navigate(['/']);
    this.localStorageService.clear();
  }

  onStart() {
    this.ngZone.runOutsideAngular(() => {
      if (this.isRunning) return;
  
      this.isRunning = true;
      this.cdr.detectChanges();
      this.stopSubject = new Subject<void>();
  
      const currentTime = this.dateFilter ? new Date(this.dateFilter) : new Date();
      currentTime.setSeconds(0, 0);
  
      this.source$
        .pipe(
          takeUntil(this.stopSubject),
          switchMap(() => {
            const start = performance.now();
            return this.bookingService.getList().pipe(
              timeout(2000),
              tap(() => {
                const end = performance.now();
                console.log(`📡 getList() took ${Math.round(end - start)}ms`);
              }),
              catchError((err) => {
                console.warn('⚠️ getList failed:', err);
                return of({ data: [] });
              }),
              map((res) => res.data ?? [])
            );
          }),
          switchMap((items) => from(items)),
          filter((item: any) => {
            if (!item._id || !item.require?.expiresDate || item.require.words < 1000) return false;
  
            const time = new Date(item.require.expiresDate);
            if (isNaN(time.getTime())) return false;
            time.setSeconds(0, 0);
  
            return (
              !this.receiveIds.has(item._id) &&
              !this.categories.includes(item.require.category) &&
              time > currentTime
            );
          }),
          tap((item) => this.receiveIds.add(item._id)), // tránh duplicate
          mergeMap((item) => this.bookItem(item), 3) // max 3 concurrent
        )
        .subscribe();
    });
  }
  
  private bookItem(item: any): Observable<any> {
    return this.bookingService.book(item._id).pipe(
      tap((book) => {
        if (book?.success) {
          console.log('✅ Booked:', item);
          this.ngZone.run(() => {
            this.cnt++;
            if (this.limit && this.cnt > this.limit) {
              this.cnt = 0;
              this.onEnd();
            }
          });
        }
      }),
      catchError((err) => {
        console.error(`❌ Failed to book item ID: ${item._id}`, err);
        return of(null);
      })
    );
  }

  onEnd() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.cdr.detectChanges();
    this.stopSubject.next();
    this.stopSubject.complete();
  }

  removeCategory(category: string) {
    this.categories = this.categories.filter((item) => item !== category);
  }

  addCategory() {
    this.categories.push(this.tempCategory);
    this.tempCategory = '';
  }
}
