import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {AuthService} from '../../services/auth.service';
import {UserService} from '../../services/user.service';
import {Course, UserCourse, Language, Translation, CourseListType, Map} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'courses-user.component.html',
  styleUrls: ['courses.component.css']
})

export class LearnCoursesUserComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private allCourses: Course[];
  private lanCourses: Map<Course[]> = {};
  selectedLanguage: Language;
  languages: Language[];
  courses: Course[];
  userCourses: Map<UserCourse> = {};
  text: Object = {};
  listType = CourseListType;
  coursesReady = false;
  isError = false;
  isReady = false;
  isDemo = false;

  constructor(
    private router: Router,
    private learnService: LearnService,
    private errorService: ErrorService,
    private utilsService: UtilsService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.getDependables();
  }

  onLanguageSelected(newLanguage: Language) {
    this.errorService.clearError();
    this.selectedLanguage = newLanguage;
    this.coursesReady = false;
    this.filterCourses();
  }

  onUnsubscribe(courseId: string) {
    this.unsubscribeCourse(courseId);
  }

  onNewCourse() {
    this.router.navigate(['/build/course/new']);
  }

  onLogIn() {
    this.router.navigate(['/auth/signin'], {queryParams: {returnUrl: this.router.url}});
  }

  onRegister() {
    this.router.navigate(['/auth/signup']);
  }

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  private getCourses() {
    this.learnService
    .fetchSubscribedCourses()
    .takeWhile(() => this.componentActive)
    .subscribe(
      courses => {
        if (courses) {
          this.allCourses = courses.subscribed;
          this.isDemo = !!courses.isDemo;
          if (courses.data) {
            courses.data.forEach((userCourse: UserCourse) => {
              this.userCourses[userCourse.courseId] = userCourse;
            });
          }
          this.coursesReady = true;
          this.getLanguages();
        }
      },
      error => {
        this.errorService.handleError(error);
        this.isError = true;
      }
    );
  }

  private unsubscribeCourse(courseId: string) {
    this.learnService
    .unSubscribeCourse(courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      result => {
        this.courses = this.lanCourses[this.selectedLanguage.code].filter(course => course._id !== courseId);
        this.lanCourses[this.selectedLanguage.code] = this.courses;
      },
      error => this.errorService.handleError(error)
    );
  }

  private getLanguages() {
    const AllLanguages = JSON.parse(JSON.stringify(this.languages)),
          languages: Language[] = [];
    let courseLan;
    if (this.allCourses && this.allCourses.length > 0) {
      AllLanguages.filter( language => {
        courseLan = this.allCourses.filter(course => course.languagePair.to === language.code);
        if (courseLan.length > 0) {
          languages.push(language);
          this.lanCourses[language.code] = courseLan;
        }
      });
      const allLanguage = this.utilsService.getAllLanguage();
      languages.unshift(allLanguage);
    }
    this.languages = languages;
    this.filterCourses();
  }

  private filterCourses() {
    let lan;
    if (this.selectedLanguage) {
      lan = this.selectedLanguage.code;
    } else {
      lan = 'eu';
    }
    if (lan === 'eu') {
      this.courses = this.allCourses;
    } else {
      if (this.lanCourses[lan]) {
        this.courses = this.lanCourses[lan];
      } else {
        this.courses = null;
      }
    }
    this.coursesReady = true;
  }

  private setActiveLanguages(languages: Language[]) {
    this.languages = languages.filter(language => language.active);
    if (this.authService.isLoggedIn()) {
      this.selectedLanguage = this.userService.getUserLearnLanguage(this.languages);
    } else {
      this.selectedLanguage = this.utilsService.getAllLanguage();
    }
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
    .takeWhile(() => this.componentActive)
    .subscribe(
      dependables => {
        this.text = this.utilsService.getTranslatedText(dependables.translations);
        this.setActiveLanguages(dependables.languages);
        this.getCourses();
        this.isReady = true;
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
