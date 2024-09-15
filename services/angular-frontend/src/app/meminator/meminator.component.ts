import { Component } from '@angular/core';
import {PictureCreatorService} from "../picture-creator.service";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-meminator',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .memenator-parent {
      display: flex;
      flex-direction: column;
      width: 1280px;
      height: 1280px;
      padding: 1em;
      border: 1px solid black;
      button {
        padding: 2em;
        margin: 2em;
        border: 2px solid black;
        background-color: #0000aa;
        color: #ffffff;
      }
      img {
        border: 1px solid black;
      }
    }
  `],
  template: `
    <div class="memenator-parent">
      <button (click)="getAMeme()">Get a meme!</button>
      <img *ngIf="inlineImageUrl" [src]="inlineImageUrl" alt="Meminator Image" />
    </div>
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
