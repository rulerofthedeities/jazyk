import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Map, Course, Language, CourseListType, UserCourse} from '../../models/course.model';
import {takeWhile} from 'rxjs/operators';

@Component({
  templateUrl: 'courses.component.html',
  styleUrls: ['courses.component.css']
})

export class LearnCoursesComponent implements OnInit, OnDestroy {
  private componentActive = true;
  selectedLanguage: Language;
  languages: Language[];
  allCourses: Course[];
  text: Object = {};
  userCourses: Map<UserCourse> = {};
  listType = CourseListType;
  isLoading = false;
  isError = false;
  isReady = false;
  allCoursesReady = false;
  courseTpe = 'all';

  constructor(
    private router: Router,
    private learnService: LearnService,
    private errorService: ErrorService,
    private utilsService: UtilsService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.getDependables();
  }

  onLanguageSelected(newLanguage: Language) {
    this.errorService.clearError();
    this.selectedLanguage = newLanguage;
    this.allCoursesReady = false;
    this.getCourses();
  }

  onNewCourse() {
    this.router.navigate(['/build/course/new']);
  }

  onChangeCourseType(tpe: string) {
    this.courseTpe = tpe;
  }

  onUnsubscribe(courseId: string) {
    this.unsubscribeCourse(courseId);
  }

  private getCourses() {
    this.getAllCourses();
    this.getSubscribedCourses();
  }

  private getAllCourses() {
    this.isLoading = true;
    this.learnService
    .fetchPublishedCourses(this.selectedLanguage.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      courses => {
        this.isLoading = false;
        this.allCourses = courses;
        this.allCoursesReady = true;
      }
    );
  }

  private getSubscribedCourses() {
    this.learnService
    .fetchSubscribedCourses()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      courses => {
        if (courses) {
          // this.allCourses = courses.subscribed;
          // this.isDemo = !!courses.isDemo;
          if (courses.data) {
            courses.data.forEach((userCourse: UserCourse) => {
              this.userCourses[userCourse.courseId] = userCourse;
            });
          }
        }
      }
    );
  }

  private unsubscribeCourse(courseId: string) {
    this.learnService
    .unSubscribeCourse(courseId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (result: UserCourse) => {
        for (const id in this.userCourses) {
          if (id === courseId) {
            this.userCourses[id] = undefined;
          }
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private setActiveLanguages(languages: Language[]) {
    this.languages = languages;
    const allLanguage = this.utilsService.getAllLanguage();
    this.languages.unshift(allLanguage);
    this.selectedLanguage = this.userService.getUserLearnLanguage(this.languages);
  }

  private getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'CoursesComponent',
      getTranslations: true,
      getLanguages: true
    };
    this.utilsService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.utilsService.getTranslatedText(dependables.translations);
        this.setActiveLanguages(dependables.courseLanguages);
        this.utilsService.setPageTitle(this.text, 'Courses');
        this.getCourses();
        this.isReady = true;
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
