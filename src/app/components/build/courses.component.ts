import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Course, Language, CourseListType, Map} from '../../models/course.model';
import {takeWhile} from 'rxjs/operators';

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
  activeLanguages: Language[];
  languages: Language[];
  isLoading = false;
  multipleLanguages = false;
  listType = CourseListType;
  coursesReady = false;
  isError = false;

  constructor(
    private router: Router,
    private buildService: BuildService,
    private errorService: ErrorService,
    private utilsService: UtilsService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.getDependables();
  }

  onNewCourse() {
    this.router.navigate(['/build/course/new']);
  }

  onLanguageSelected(newLanguage: Language) {
    this.selectedLanguage = newLanguage;
    this.filterCourses();
  }

  private getCourses() {
    this.isLoading = true;
    this.buildService
    .fetchAuthorCourses()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      courses => {
        this.isLoading = false;
        this.courses = courses;
        if (courses && courses.length) {
          this.getLanguages();
        }
        this.coursesReady = true;
      },
      error => {
        this.errorService.handleError(error);
        this.isError = true;
      }
    );
  }

  private getLanguages() {
    const AllLanguages = [...this.activeLanguages];
    const languages: Language[] = [];
    let courseLan;
    AllLanguages.filter( language => {
      courseLan = this.courses.filter( course => course.languagePair.to === language.code);
      if (courseLan.length > 0) {
        languages.push(language);
        this.lanCourses[language.code] = courseLan;
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
      lan = this.selectedLanguage.code;
    } else {
      lan = this.getDefaultLanguage();
    }
    if (this.lanCourses[lan]) {
      this.courses = this.lanCourses[lan];
    } else {
      this.courses = null;
    }
  }

  private getDefaultLanguage(): string {
    let lan = '';
    if (this.activeLanguages.length > 0) {
      lan = this.activeLanguages[0].code;
    }
    return lan;
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
        this.activeLanguages = dependables.courseLanguages;
        this.utilsService.setPageTitle(this.text, 'Teach');
        this.getCourses();
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
