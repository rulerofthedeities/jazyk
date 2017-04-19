import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson, Question} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-lesson',
  templateUrl: 'lesson.component.html'
})

export class BuildLessonComponent implements OnInit, OnDestroy {
  componentActive = true;
  wordForm: FormGroup;
  lesson: Lesson;
  question: Question;
  isFormReady = false;

  constructor(
    private route: ActivatedRoute,
    private buildService: BuildService,
    private errorService: ErrorService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['id']) {
          const lessonId = params['id'];
          this.getLesson(lessonId);
        }
      }
    );
  }

  newWord() {
    this.question = {
      wordPairId: '',
      testTypes: []
    };
    this.buildForm();
  }

  buildForm() {
    this.wordForm = this.formBuilder.group({
      wordPairId: [this.question.wordPairId],
      testTypes: [this.question.testTypes]
    });
    this.isFormReady = true;
  }

  getLesson(lessonId: string) {
    this.buildService
    .fetchLesson(lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lesson => this.lesson = lesson,
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
