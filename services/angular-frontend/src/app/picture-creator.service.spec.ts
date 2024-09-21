import { TestBed } from '@angular/core/testing';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import { PictureCreatorService } from './picture-creator.service';
import {provideHttpClient} from "@angular/common/http";

describe('PictureCreatorService', () => {
  let service: PictureCreatorService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PictureCreatorService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    service.createPicture().subscribe(
      pictureData => expect(pictureData).toBeDefined()
    );
    const operation = httpTestingController.expectOne('/backend/createPicture');

    expect(operation.request.method).toEqual('POST');

    // create a blob (reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob)
    const obj = { hello: "world" };
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: "application/json",
    });
    // send a mock set of data bytes
    operation.flush(blob);

    httpTestingController.verify();
  });
});
