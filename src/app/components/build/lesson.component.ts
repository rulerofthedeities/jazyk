import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {Lesson, Translation} from '../../models/course.model';
import {Filter, WordPairDetail, Exercise} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-lesson',
  templateUrl: 'lesson.component.html',
  styles: [`
    h1, .footer {
      display: block;
      background-color: rgba(239, 239, 239, .9);
      padding: 16px;
      border-radius: 6px;
      margin: 0 -15px 15px -15px;
    }
    h1 .btn {
      margin-bottom: 6px;
      margin-left: 24px;
    }
  `]
})

export class BuildLessonComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private lanLocal: string;
  private lanForeign: string;
  lesson: Lesson;
  isNewWord = false;
  isEditMode = false;
  isBidirectional = false;
  text: Object = {};

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

  onExerciseAdded(exercise: Exercise) {
    console.log('exercise added to lesson', exercise);
    this.lesson.exercises.push(exercise);
    this.isNewWord = false;
  }

  onNewWord() {
    this.isNewWord = true;
  }

  onEditLesson() {
    this.isEditMode = true;
  }

  onCloseHeader() {
    this.isEditMode = false;
  }

  private setText(translations: Translation[]) {
    this.text = this.utilsService.getTranslatedText(translations);
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
        this.setBidirectional();
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

  private setBidirectional() {
    const exerciseTpes = this.lesson.exerciseTpes;
    if (exerciseTpes) {
      if (exerciseTpes.exam.bidirectional ||
          exerciseTpes.learn.bidirectional ||
          exerciseTpes.practise.bidirectional ||
          exerciseTpes.test.bidirectional) {
        this.isBidirectional = true;
      }
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
