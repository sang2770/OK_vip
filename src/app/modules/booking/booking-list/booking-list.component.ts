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
  Subject,
  catchError,
  interval,
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

      this.source$.pipe(takeUntil(this.stopSubject)).subscribe(() => {
        this.bookingService
          .getList()
          .pipe(
            timeout(2000),
            catchError((err) => {
              // console.warn('Request failed:', err);
              return of({ data: [] });
            })
          )
          .subscribe((res) => {
            const data: any[] = res.data ?? [];

            data.forEach((item) => {
              if (!item.require?.expiresDate) return;
              const time = new Date(item.require.expiresDate);
              if (isNaN(time.getTime())) return;
              time.setSeconds(0, 0);
              const currentTime = this.dateFilter
                ? new Date(this.dateFilter)
                : new Date();
              currentTime.setSeconds(0, 0);
              if (
                item._id &&
                item.require?.words >= 1000 &&
                !this.receiveIds.has(item._id) &&
                !this.categories.includes(item.require?.category) &&
                time > currentTime
              ) {
                this.receiveIds.add(item._id);
                this.bookingService
                  .book(item._id)
                  .pipe(
                    tap((book) => {
                      if (book.success) {
                        console.log('success', item);
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
                      console.error(`Failed to book item with ID ${item._id}`, err);
                      return of(null);
                    })
                  )
                  .subscribe();
              }
            });
          });
      });
    });
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
