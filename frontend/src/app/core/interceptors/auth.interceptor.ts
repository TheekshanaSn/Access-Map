import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  let authReq = req;

  // Attach Bearer token to API requests
  if (token && (req.url.startsWith('/api') || req.url.startsWith('http://localhost:5000/api'))) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If server returns 401 Unauthorized (and not a login attempt failure), session is expired
      if (error.status === 401 && !req.url.includes('/api/auth/login')) {
        authService.clearSession();
        // Redirect to login page if currently on a protected route
        const currentUrl = router.routerState.snapshot.url;
        if (currentUrl.includes('/admin') || currentUrl.includes('/submit-report')) {
          router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
        }
      }
      return throwError(() => error);
    })
  );
};

