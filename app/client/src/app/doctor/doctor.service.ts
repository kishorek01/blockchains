import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {

  private doctorURL = 'http://localhost:3001/doctors';

  constructor(private http: HttpClient) { }

  public createDoctor(data: any): Observable<any> {
    return this.http.patch(this.doctorURL + '/register', data);
  }
}
