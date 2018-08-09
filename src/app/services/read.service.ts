import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class ReadService {

  constructor(
    private http: HttpClient
  ) {}

}
