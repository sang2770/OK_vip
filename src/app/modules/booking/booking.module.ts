import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingRoutingModule } from './booking-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { BookingListComponent } from './booking-list/booking-list.component';

@NgModule({
  declarations: [BookingListComponent],
  imports: [CommonModule, BookingRoutingModule, SharedModule]
})
export class BookingModule {}
