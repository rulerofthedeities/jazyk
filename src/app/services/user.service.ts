import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class UserService {
  private singleton = 1;
  interfaceLan: string;

  constructor(
    private http: Http
  ) {}

  getSingleton(): number {
    return this.singleton;
  }

  addToSingleton(s: number) {
    this.singleton += s;
  }

  setInterfaceLan(lan: string) {
    if (lan) {
      this.interfaceLan = lan;
    }
  }
}
