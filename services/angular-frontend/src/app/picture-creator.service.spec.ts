import { TestBed } from '@angular/core/testing';

import { PictureCreatorService } from './picture-creator.service';

describe('PictureCreatorService', () => {
  let service: PictureCreatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PictureCreatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
