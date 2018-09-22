import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { Language, DependableOptions } from '../models/main.model';
import { appTitle } from './shared.service';
import { Observable } from 'rxjs';
import { Translation, Dependables } from '../models/main.model';
import { retry } from 'rxjs/operators';

@Injectable()
export class UtilsService {

  constructor(
    private http: HttpClient,
    private titleService: Title
  ) {}






}
