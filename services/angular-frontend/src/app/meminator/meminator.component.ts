import { Component } from '@angular/core';
import {PictureCreatorService} from "../picture-creator.service";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-meminator',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './meminator.component.scss',
  template: `
   <button (click)="getAMeme()">Get a meme!</button>
   <img *ngIf="inlineImageUrl" [src]="inlineImageUrl" alt="Meminator Image" />
  `
})
export class MeminatorComponent {

  constructor(private pictureCreator:PictureCreatorService) { }

  inlineImageUrl?: string;

  getAMeme() {
    this.pictureCreator.createPicture()
      .subscribe((pictureData: Blob) => {
        this.inlineImageUrl = URL.createObjectURL(pictureData);
    });
  }

}
