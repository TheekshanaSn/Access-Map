import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { DemoBannerComponent } from './shared/components/demo-banner/demo-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, DemoBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'AccessMap';
}
