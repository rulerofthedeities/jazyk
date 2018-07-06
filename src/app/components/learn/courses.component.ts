import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Course, Language, CourseListType} from '../../models/course.model';
import {takeWhile} from 'rxjs/operators';

@Component({
  templateUrl: 'courses.component.html',
  styleUrls: ['courses.component.css']
})

export class LearnCoursesComponent implements OnInit, OnDestroy {
  private componentActive = true;
  selectedLanguage: Language;
  languages: Language[];
  courses: Course[];
  text: Object = {};
  listType = CourseListType;
  isLoading = false;
  isError = false;
  isReady = false;
  coursesReady = false;

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
    this.coursesReady = false;
    this.getCourses();
  }

  onNewCourse() {
    this.router.navigate(['/build/course/new']);
  }

  private getCourses() {
    this.isLoading = true;
    this.learnService
    .fetchPublishedCourses(this.selectedLanguage.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      courses => {
        this.isLoading = false;
        this.courses = courses;
        this.coursesReady = true;
      },
      error => {
        this.errorService.handleError(error);
        this.isError = true;
      }
    );
  }

  private setActiveLanguages(languages: Language[]) {
    this.languages = languages.filter(language => language.active);
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
        this.setActiveLanguages(dependables.languages);
        this.utilsService.setPageTitle(this.text, 'Courses');
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
