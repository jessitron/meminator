import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MeminatorComponent} from "./meminator/meminator.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MeminatorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-frontend';
}
