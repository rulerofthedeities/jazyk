import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {Lesson, Translation} from '../../models/course.model';
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
  lanLocal: string;
  lanForeign: string;
  text: Object = {};
  @ViewChild(BuildExerciseComponent) exerciseComponent;
  @ViewChild(FilterListComponent) listComponent;

  constructor(
    private route: ActivatedRoute,
    private buildService: BuildService,
    private utilsService: UtilsService,
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

/*
  onFilterSelected(filter: Filter) {
    this.listComponent.filterUpdated(filter);
  }

  onWordSelected(word: WordPairDetail) {
    console.log('word selected', word);
    this.exerciseComponent.newExercise(word);
  }

  onExerciseAdded(exercise: Exercise) {
    this.lesson.exercises.push(exercise);
  }
  */

  onNewWord() {
    this.isNewWord = true;
  }

  private setText(translations: Translation[]) {
    let keys = [
      'Enterword' + this.lanForeign,
      'Enterword' + this.lanLocal
    ];
    keys = keys.concat(this.utilsService.getWordTypes());
    this.text = this.utilsService.getTranslatedText(translations, keys);
  }

  private getLesson(lessonId: string) {
    this.buildService
    .fetchLesson(lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lesson => {
        this.lesson = lesson;
        this.lanLocal = lesson.languagePair.from.slice(0, 2);
        this.lanForeign = lesson.languagePair.to.slice(0, 2);
        this.getTranslations();
      },
      error => this.errorService.handleError(error)
    );
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.lanLocal, 'LessonComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        this.setText(translations);
      },
      error => this.errorService.handleError(error)
    );
  }


  ngOnDestroy() {
    this.componentActive = false;
  }
}
