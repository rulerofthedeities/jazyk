import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson} from '../../models/course.model';
import {Filter, WordPairDetail, Exercise} from '../../models/exercise.model';
import {BuildExerciseComponent} from './exercise.component';
import {FilterListComponent} from '../fields/filter-list.component';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-lesson',
  templateUrl: 'lesson.component.html'
})

export class BuildLessonComponent implements OnInit, OnDestroy {
  componentActive = true;
  lesson: Lesson;
  isNewWord = false;
  lanFrom: string;
  lanTo: string;
  @ViewChild(BuildExerciseComponent) exerciseComponent;
  @ViewChild(FilterListComponent) listComponent;

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
        }
      }
    );
  }

  onFilterSelected(filter: Filter) {
    this.listComponent.filterUpdated(filter);
  }

  onWordSelected(word: WordPairDetail) {
    console.log('word selected', word);
    this.exerciseComponent.newExercise(word);
  }

  onNewWord() {
    this.isNewWord = true;
  }

  onExerciseAdded(exercise: Exercise) {
    this.lesson.exercises.push(exercise);
  }

  private getLesson(lessonId: string) {
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
