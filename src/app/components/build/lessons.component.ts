import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson} from '../../models/course.model';

@Component({
  selector: 'km-build-lessons',
  template: `
    LESSONS / CHAPTERS

    <div *ngFor="let lesson of lessons">
      {{lesson.name}}
    </div>

    <pre>{{lessons | json}}</pre>
  `
})

export class BuildLessonsComponent implements OnInit, OnDestroy {
  @Input() courseId: string;
  @Input() lessons: Lesson[];
  private componentActive = true;

  constructor(
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {

  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
