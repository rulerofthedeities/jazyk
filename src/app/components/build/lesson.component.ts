import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {Course, Lesson, Translation} from '../../models/course.model';
import {Filter, WordPairDetail, Exercise} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-lesson',
  templateUrl: 'lesson.component.html',
  styleUrls: ['headers.css']
})

export class BuildLessonComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private lanLocal: string;
  private lanForeign: string;
  course: Course;
  chapters: string[];
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

  onCloseHeader(updatedLesson: Lesson) {
      console.log('header closed');
    if (updatedLesson) {
      this.lesson = updatedLesson;
      console.log('updated lesson');
      // Check if new chapter was added
      if (this.chapters.filter(chapter => chapter === updatedLesson.chapterName).length < 1) {
        console.log('added chapter');
        this.addChapter(updatedLesson.chapterName);
      }
    }
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
        // this.getChapters();
        this.getCourse(); // for header & chapters
      },
      error => this.errorService.handleError(error)
    );
  }

/*
  private getChapters() {
    this.buildService
    .fetchChapters(this.lesson.courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      chapters => {
        console.log('chapters', chapters);
        this.chapters = chapters;
      },
      error => this.errorService.handleError(error)
    );
  }
*/

  private addChapter(chapterName: string) {
    if (chapterName) {
      this.chapters.push(chapterName);
      this.buildService
      .addChapter(this.lesson.courseId, chapterName)
      .takeWhile(() => this.componentActive)
      .subscribe(
        savedChapter => {},
        error => this.errorService.handleError(error)
      );
    }
  }

  private getCourse() {
    this.buildService
    .fetchCourse(this.lesson.courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      course => {
        this.course = course;
        this.chapters = course.chapters;
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
      if (exerciseTpes.study.bidirectional ||
          exerciseTpes.practise.bidirectional ||
          exerciseTpes.test.bidirectional ||
          exerciseTpes.exam.bidirectional) {
        this.isBidirectional = true;
      }
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
