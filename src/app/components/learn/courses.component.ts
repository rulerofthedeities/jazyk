import {Component, OnInit, OnDestroy} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Course, Language, Translation, CourseListType} from '../../models/course.model';
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
  isReady = false;

  constructor(
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
    this.getCourses();
  }

  private getCourses() {
    this.learnService
    .fetchPublicCourses(this.selectedLanguage.code)
    .takeWhile(() => this.componentActive)
    .subscribe(
      courses => this.courses = courses,
      error => this.errorService.handleError(error)
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
