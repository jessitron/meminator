import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import {provideHttpClientTesting} from "@angular/common/http/testing";
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {provideHttpClient} from "@angular/common/http";

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
