import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Course, Lesson, LessonId, Language, Translation} from '../../models/course.model';
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
  lessonIds: LessonId[];
  chapters: string[];
  isEditMode = false;
  isNewLesson = false;
  isCourseReady = false;
  text: Object = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private buildService: BuildService,
    private errorService: ErrorService,
    private utilsService: UtilsService,
    private userService: UserService
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

  onSortedLessons(lessonId: LessonId) {
    this.setLessonIds(lessonId);
    this.saveResortedLessons();
  }

  onLessonDone(lessonAdded: Lesson) {
    this.isNewLesson = false;
    console.log('added Lesson', lessonAdded);
    if (lessonAdded) {
      this.lessons.push(lessonAdded);
      // Check if new chapter was added
      if (this.chapters.filter(chapter => chapter === lessonAdded.chapterName).length < 1) {
        this.addChapter(lessonAdded.chapterName, lessonAdded._id);
      } else {
        // Add lessonId to chapter in course
        this.addLessonId(lessonAdded.chapterName, lessonAdded._id);
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
        this.isCourseReady = true;
        if (course) {
          this.chapters = course.chapters;
          this.lessonIds = course.lessons;
          this.setDefaultLanguage(course.languagePair.to);
          this.getLessons(courseId);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getLessons(courseId: string) {
    this.buildService
    .fetchLessons(courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lessons => this.lessons = lessons,
      error => this.errorService.handleError(error)
    );
  }

  private addChapter(chapterName: string, lessonId: string) {
    if (chapterName) {
      this.chapters.push(chapterName);
      this.buildService
      .addChapter(this.course._id, chapterName, lessonId)
      .takeWhile(() => this.componentActive)
      .subscribe(
        savedChapter => {},
        error => this.errorService.handleError(error)
      );
    }
  }

  private addLessonId(chapterName: string, lessonId: string) {
    this.buildService
    .updateCourseLesson(this.course._id, chapterName, lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      savedChapter => {},
      error => this.errorService.handleError(error)
    );
  }

  private setLessonIds(updatedLessonId: LessonId) {
    const chapterName = updatedLessonId.chapter;
    const lessonIdItems = updatedLessonId.lessonIds;
    const lessonId: LessonId = this.lessonIds.filter(lesson => lesson.chapter === chapterName)[0];
    if (lessonId && lessonIdItems) {
      lessonId.lessonIds = lessonIdItems;
    } else {
      const newLessonId = {chapter: chapterName, lessonIds: lessonIdItems};
      this.lessonIds.push(newLessonId);
    }
  }

  private saveResortedLessons() {
    console.log('saving lesson Ids', this.lessonIds);

    this.buildService
    .updateLessonIds(this.course._id, this.lessonIds)
    .takeWhile(() => this.componentActive)
    .subscribe(
      () => {console.log('updated sorted lesson ids'); },
      error => this.errorService.handleError(error)
    );
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
    .fetchTranslations(this.userService.user.lan, 'CourseComponent')
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
