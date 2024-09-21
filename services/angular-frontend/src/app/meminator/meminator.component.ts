import { Component } from '@angular/core';
import {PictureCreatorService} from "../picture-creator.service";
import {CommonModule} from "@angular/common";
import { trace, context, } from '@opentelemetry/api';


@Component({
  selector: 'app-meminator',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./meminator.component.scss'],
  templateUrl: './meminator.component.html'
})
export class MeminatorComponent {

  constructor(private pictureCreator:PictureCreatorService) { }

  inlineImageUrl?: string;

  getAMeme() {
    const tracer = trace.getTracer('fetch-blob-data');
    const blobFetchSpan = tracer.startActiveSpan('interact-with-service', (span) => {
      // create span
      this.pictureCreator.createPicture()
        .subscribe(
          (pictureData: Blob) => {
            this.inlineImageUrl = URL.createObjectURL(pictureData);
            span.end();
          },
          (error) => {
            span.recordException(error)
            span.end();
          });
    });
  }

}
