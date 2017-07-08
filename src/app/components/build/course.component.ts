import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {Chapter, Course, Lesson, Language, Translation} from '../../models/course.model';
import {config} from '../../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'course.component.html',
  styleUrls: ['headers.css', 'course.css']
})

export class BuildCourseComponent implements OnInit, OnDestroy {
  private componentActive = true;
  course: Course;
  languages: Language[];
  currentLanguage: Language;
  lessons: Lesson[];
  chapters: Chapter[];
  isEditMode = false;
  isNewLesson = false;
  text: Object = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private buildService: BuildService,
    private errorService: ErrorService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.languages = this.utilsService.getActiveLanguages();
    this.getTranslations();
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['id']) {
          const courseId = params['id'];
          if (courseId === 'new') {
            this.isEditMode = true;
            this.setDefaultLanguage(params['lan']);
          } else {
            this.isEditMode = false;
            this.getCourse(courseId);
          }
        }
      }
    );
  }

  onEditCourse() {
    this.isEditMode = true;
  }

  onCloseHeader(updatedCourse: Course) {
    if (updatedCourse) {
      this.course = updatedCourse;
    }
    this.isEditMode = false;
  }

  onNewLesson() {
    this.isNewLesson = true;
  }

  onLessonDone(lessonAdded: Lesson) {
    this.isNewLesson = false;
    if (lessonAdded) {
      this.lessons.push(lessonAdded);
      // Check if new chapter was added
      if (this.chapters.filter(chapter => chapter.name === lessonAdded.chapter).length < 1) {
        this.addChapter(lessonAdded.chapter);
      }
    }
  }

  private getCourse(courseId: string) {
    this.buildService
    .fetchCourse(courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      course => {
        this.course = course;
        this.setDefaultLanguage(course.languagePair.to);
        this.getLessonsAndChapters(courseId);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getLessonsAndChapters(courseId: string) {
    this.buildService
    .fetchLessonsAndChapters(courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => {
        this.lessons = data.lessons;
        this.chapters = data.chapters;
      },
      error => this.errorService.handleError(error)
    );
  }

  private addChapter(chapterName: string) {
    if (chapterName) {
      const newChapter = {
        courseId: this.course._id,
        name: chapterName,
        nr: this.chapters.length + 1
      };
      this.chapters.push(newChapter);
      this.buildService
      .addChapter(newChapter)
      .takeWhile(() => this.componentActive)
      .subscribe(
        savedChapter => {},
        error => this.errorService.handleError(error)
      );
    }
  }

  private setDefaultLanguage(languageId: string) {
    let selLan: Language[];
    if (languageId) {
      selLan = this.languages.filter(lan => lan._id === languageId);
    }
    if (selLan && selLan.length > 0) {
      this.currentLanguage = selLan[0];
    } else {
      this.currentLanguage = this.languages[0];
    }
  }

  private setText(translations: Translation[]) {
    this.text = this.utilsService.getTranslatedText(translations);
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(config.language.slice(0, 2), 'CourseComponent')
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
