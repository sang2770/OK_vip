import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from './login.service';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage?: string;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private localStorageService: LocalStorageService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['tuanh', [Validators.required]],
      password: ['123456', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const { username, password } = this.loginForm.value;

    this.loginService.login(username, password).subscribe({
      next: (response) => {
        const data = response.data;
        const token = data.jwtToken;
        if (!token) {
          this.errorMessage = 'Login failed';
          return;
        }

        this.localStorageService.setItem('token', token);
        this.localStorageService.setItem('username', username);
        this.router.navigate(['/booking']);
      },
      error: (err) => {
        this.errorMessage = err.error.message;
      },
      complete: () => {},
    });
  }
}
