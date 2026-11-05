import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ExploreMapComponent } from './features/map/explore-map.component';
import { PlacesListComponent } from './features/places/places-list/places-list.component';
import { PlaceDetailComponent } from './features/places/place-detail/place-detail.component';
import { SubmitReportComponent } from './features/submit-report/submit-report.component';
import { AboutComponent } from './features/about/about.component';
import { AuthComponent } from './features/auth/auth.component';
import { AdminComponent } from './features/admin/admin.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'AccessMap — Explore Places. Move With Confidence.',
  },
  {
    path: 'explore-map',
    component: ExploreMapComponent,
    title: 'Explore Map — AccessMap',
  },
  {
    path: 'plan-route',
    component: ExploreMapComponent,
    title: 'Plan Accessible Route — AccessMap',
  },
  {
    path: 'places',
    component: PlacesListComponent,
    title: 'Accessible Places Directory — AccessMap',
  },
  {
    path: 'places/:id',
    component: PlaceDetailComponent,
    title: 'Place Accessibility Details — AccessMap',
  },
  {
    path: 'submit-report',
    component: SubmitReportComponent,
    title: 'Submit Accessibility Report — AccessMap',
  },
  {
    path: 'about',
    component: AboutComponent,
    title: 'About AccessMap & Physical Standards',
  },
  {
    path: 'login',
    component: AuthComponent,
    title: 'Sign In — AccessMap',
  },
  {
    path: 'register',
    component: AuthComponent,
    title: 'Register — AccessMap',
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    title: 'Mobile Profile & Settings — AccessMap',
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    title: 'Moderation Dashboard — AccessMap',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
