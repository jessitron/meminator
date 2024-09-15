import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeminatorComponent } from './meminator.component';
import {HttpClient} from "@angular/common/http";

describe('MeminatorComponent', () => {
  let component: MeminatorComponent;
  let fixture: ComponentFixture<MeminatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [HttpClient],
      imports: [MeminatorComponent],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeminatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
