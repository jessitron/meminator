import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class PictureCreatorService {

  constructor(private http: HttpClient) { }

  createPicture() {
    return this.http.post('/backend/createPicture', {}, {
      responseType: 'blob'
    });
  }
}
