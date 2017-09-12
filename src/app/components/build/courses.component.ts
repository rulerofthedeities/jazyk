import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Course, Language, Translation} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

@Component({
  templateUrl: 'courses.component.html',
  styleUrls: ['../learn/courses.component.css']
})

export class BuildCoursesComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private lanCourses: Map<Course[]> = {}; // Group courses per language
  courses: Course[];
  text: Object = {};
  selectedLanguage: Language;
  languages: Language[];
  infoMsg: string;
  multipleLanguages = false;

  constructor(
    private router: Router,
    private buildService: BuildService,
    private errorService: ErrorService,
    private utilsService: UtilsService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.getTranslations();
  }

  onNewCourse() {
    this.router.navigate(['/build/course/new']);
  }

  onLanguageSelected(newLanguage: Language) {
    this.selectedLanguage = newLanguage;
    this.filterCourses();
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

  private getCourses() {
    this.buildService
    .fetchUserCourses()
    .takeWhile(() => this.componentActive)
    .subscribe(
      courses => {
        this.courses = courses;
        if (courses && courses.length < 1) {
          this.infoMsg = this.text['NoBuiltCourses'];
        } else {
          this.getLanguages();
        }
      },
      error => this.errorService.handleError(error)
    );
  }
  private getLanguages() {
    const AllLanguages = this.utilsService.getActiveLanguages();
    const languages: Language[] = [];
    let courseLan;
    AllLanguages.filter( language => {
      courseLan = this.courses.filter( course => course.languagePair.to === language._id);
      if (courseLan.length > 0) {
        languages.push(language);
        this.lanCourses[language._id] = courseLan;
      }
    });
    this.languages = languages;
    this.selectedLanguage = this.userService.getUserLearnLanguage(this.languages);
    this.filterCourses();
    if (this.languages.length > 1) {
      this.multipleLanguages = true;
    }
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
