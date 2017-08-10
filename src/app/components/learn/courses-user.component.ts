import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Course, Language, Translation} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'courses-user.component.html',
  styleUrls: ['courses.component.css']
})

export class LearnCoursesUserComponent implements OnInit, OnDestroy {
  private componentActive = true;
  selectedLanguage: Language;
  languages: Language[];
  courses: Course[];
  text: Object = {};

  constructor(
    private router: Router,
    private learnService: LearnService,
    private errorService: ErrorService,
    private utilsService: UtilsService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.getLanguages();
    this.getCourses();
  }

  onLanguageSelected(newLanguage: Language) {
    this.selectedLanguage = newLanguage;
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.lan, 'CoursesComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        this.getCourses();
        this.text = this.utilsService.getTranslatedText(translations);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getLanguages() {
    this.languages = this.utilsService.getActiveLanguages();
    this.selectedLanguage = this.userService.getUserLearnLanguage(this.languages);
  }

  private getCourses() {
    this.learnService
    .fetchCourses(this.selectedLanguage)
    .takeWhile(() => this.componentActive)
    .subscribe(
      courses => {
        this.courses = courses;
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
