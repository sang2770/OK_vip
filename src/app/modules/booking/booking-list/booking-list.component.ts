import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
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

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.scss',
})
export class BookingListComponent {
  username?: string;
  cnt = 0;
  source$ = interval(1000);
  stopSubject = new Subject<void>();
  isRunning = false;
  receiveIds = new Set<string>();

  constructor(
    private localStorageService: LocalStorageService,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.username = this.localStorageService.getItem('username') ?? '';
  }

  onStart() {
    this.ngZone.runOutsideAngular(() => {
      if (this.isRunning) return;

      this.isRunning = true;
      this.stopSubject = new Subject<void>();

      this.source$.pipe(takeUntil(this.stopSubject)).subscribe(() => {
        this.bookingService
          .getList()
          .pipe(
            timeout(2000),
            catchError((err) => {
              console.warn('Request failed:', err);
              return of();
            })
          )
          .subscribe((res) => {
            const data: any[] = res.data ?? [];

            data.forEach((item) => {
              if (
                item._id &&
                (item.require?.words >= 1000) &&
                !this.receiveIds.has(item._id) &&
                item.require?.category !== 'Guestpost'
              ) {
                this.receiveIds.add(item._id);
                console.log(item);

                this.bookingService
                  .book(item._id)
                  .pipe(
                    tap((book) => {
                      if (book.success) {
                        this.cnt++;
                      }
                    })
                  )
                  .subscribe();
              }
            });
            this.ngZone.run(() => {
              this.cdr.detectChanges();
            });
          });
      });
    });
  }
  onEnd() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.stopSubject.next();
    this.stopSubject.complete();
  }
}
