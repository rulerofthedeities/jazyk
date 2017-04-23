import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson} from '../../models/course.model';
import {WordPairDetail, Exercise} from '../../models/exercise.model';
import {BuildExerciseComponent} from './exercise.component';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-lesson',
  templateUrl: 'lesson.component.html',
  styles: [`
    .lesson {position: relative;}
    .filter {
      position: absolute;
    }
    .exercise {
      position: relative;
      top: 50px;
      left: 250px;
    }
    .exercises {
      position: relative;
      top: 60px;
      left: 250px;
    }
  `]
})

export class BuildLessonComponent implements OnInit, OnDestroy {
  componentActive = true;
  lesson: Lesson;
  exercises: Exercise[];
  isNewWord = false;
  lanFrom: string;
  lanTo: string;
  @ViewChild(BuildExerciseComponent) exerciseComponent;

  constructor(
    private route: ActivatedRoute,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['id']) {
          const lessonId = params['id'];
          this.getLesson(lessonId);
          this.getExercises(lessonId);
        }
      }
    );
  }

  onWordSelected(word: WordPairDetail) {
    this.exerciseComponent.newExercise(word);
  }

  onNewWord() {
    this.isNewWord = true;
  }

  getLesson(lessonId: string) {
    this.buildService
    .fetchLesson(lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lesson => {
        this.lesson = lesson;
        this.lanFrom = lesson.languagePair.from.slice(0, 2);
        this.lanTo = lesson.languagePair.to.slice(0, 2);
      },
      error => this.errorService.handleError(error)
    );
  }

  getExercises(lessonId: string) {
    this.buildService
    .fetchExercises(lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      exercises => {console.log('exercises', exercises); this.exercises = exercises; },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
