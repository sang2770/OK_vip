import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
console.log('Routing module loaded');

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'booking',
    loadChildren: () => import('./modules/booking/booking.module').then(m => m.BookingModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
