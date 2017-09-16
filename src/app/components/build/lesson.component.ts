import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {UserService} from '../../services/user.service';
import {Course, Lesson, Translation} from '../../models/course.model';
import {Filter, WordPairDetail} from '../../models/word.model';
import {Exercise} from '../../models/exercise.model';
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
  tab = 'words';
  isCourseAccess = false;
  infoMsg = '';

  constructor(
    private route: ActivatedRoute,
    private buildService: BuildService,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['id']) {
          const lessonId = params['id'];
          this.getTranslations(lessonId);
        }
      }
    );
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
        this.addChapter(updatedLesson.chapterName, this.lesson._id);
      }
    }
    this.isEditMode = false;
  }

  onExercisesAdded(exercises: Exercise[]) {
    this.lesson.exercises = this.lesson.exercises.concat(exercises);
    this.isNewWord = false;
  }

  onExerciseRemoved(toRemove: number) {
    this.lesson.exercises.splice(toRemove, 1);
  }

  onTabSelected(tab: string) {
    this.tab = tab;
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
        console.log('lesson', lesson);
        this.lesson = lesson;
        if (lesson) {
          this.lanLocal = lesson.languagePair.from;
          this.lanForeign = lesson.languagePair.to;
          this.getCourse(); // for header & chapters
          this.setBidirectional();
        } else {
          console.log(this.text);
          this.infoMsg = this.text['LessonIdInvalid'];
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private addChapter(chapterName: string, lessonId: string) {
    if (chapterName) {
      this.chapters.push(chapterName);
      this.buildService
      .addChapter(this.lesson.courseId, chapterName, lessonId)
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
        if (course) {
          this.chapters = course.chapters;
          this.isCourseAccess = true;
        } else {
          this.infoMsg = this.text['NotAuthorizedEditCourse'];
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getTranslations(lessonId: string) {
    this.utilsService
    .fetchTranslations(this.userService.user.lan, 'LessonComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        console.log(translations);
        this.setText(translations);
        this.getLesson(lessonId);
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
