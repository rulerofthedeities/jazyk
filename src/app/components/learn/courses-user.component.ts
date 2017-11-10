import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Course, Language, Translation, CourseListType} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

@Component({
  templateUrl: 'courses-user.component.html',
  styleUrls: ['courses.component.css']
})

export class LearnCoursesUserComponent implements OnInit, OnDestroy {
  private componentActive = true;
  selectedLanguage: Language;
  languages: Language[];
  private allCourses: Course[];
  private lanCourses: Map<Course[]> = {};
  courses: Course[];
  text: Object = {};
  listType = CourseListType;

  constructor(
    private router: Router,
    private learnService: LearnService,
    private errorService: ErrorService,
    private utilsService: UtilsService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.getTranslations();
  }

  onLanguageSelected(newLanguage: Language) {
    this.selectedLanguage = newLanguage;
    this.filterCourses();
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.main.lan, 'CoursesComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        this.getCourses();
        this.text = this.utilsService.getTranslatedText(translations);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getCourses() {
    if (this.userService.user) {
      this.learnService
      .fetchUserCourses()
      .takeWhile(() => this.componentActive)
      .subscribe(
        courses => {
          this.allCourses = courses;
          this.getLanguages();
        },
        error => this.errorService.handleError(error)
      );
    } else {
      this.allCourses = [];
    }
  }

  private getLanguages() {
    const AllLanguages = this.utilsService.getActiveLanguages();
    const languages: Language[] = [];
    let courseLan;
    if (this.allCourses && this.allCourses.length > 0) {
      AllLanguages.filter( language => {
        courseLan = this.allCourses.filter( course => course.languagePair.to === language._id);
        if (courseLan.length > 0) {
          languages.push(language);
          this.lanCourses[language._id] = courseLan;
        }
      });
    }
    this.languages = languages;
    this.selectedLanguage = this.userService.getUserLearnLanguage(this.languages);
    this.filterCourses();
  }

  private filterCourses() {
    let lan;
    if (this.selectedLanguage) {
      lan = this.selectedLanguage._id;
    } else {
      lan = this.utilsService.getDefaultLanguage();
    }
    if (this.lanCourses[lan]) {
      this.courses = this.lanCourses[lan];
    } else {
      this.courses = null;
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
