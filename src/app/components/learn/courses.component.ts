import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Course, Language, Translation, CourseListType} from '../../models/course.model';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/takeWhile';

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
    this.selectedLanguage = newLanguage;
    this.coursesReady = false;
    this.getCourses();
  }

  onError(error) {
    console.log('e', error);
  }

  onCompleted() {
    console.log('completed');
  }

  onNewCourse() {
    this.router.navigate(['/build/course/new']);
  }

  private getCourses() {
    this.learnService
    .fetchPublishedCourses(this.selectedLanguage.code)
    .takeWhile(() => this.componentActive)
    .subscribe(
      courses => {
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
    const allLanguages: Language = {
      code: 'eu',
      name: 'AllLanguages',
      nativeName: '',
      interface: true,
      active: true,
      article: false
    };
    this.languages.unshift(allLanguages);
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
