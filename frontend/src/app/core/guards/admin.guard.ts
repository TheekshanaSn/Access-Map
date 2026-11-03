import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Must be logged in
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  // 2. Must possess moderator or admin role
  if (authService.isModerator() || authService.isAdmin()) {
    return true;
  }

  // Regular users are redirected to home with access denied indication
  router.navigate(['/']);
  return false;
};

