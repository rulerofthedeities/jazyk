import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Course, Language, Translation} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'courses.component.html',
  styles: [`
    .lanselector {
      padding: 0;
      margin-bottom: 1px;
    }
    .nocourses {
      margin-bottom: 12px;
    }
  `]
})

export class LearnCoursesComponent implements OnInit, OnDestroy {
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
  }

  onLanguageSelected(newLanguage: Language) {
    this.selectedLanguage = newLanguage;
    this.getCourses();
  }

  onNewCourse() {
    this.router.navigate(['/build/course/new', {lan: this.selectedLanguage._id}]);
  }

  private getLanguages() {
    this.languages = this.utilsService.getActiveLanguages();
    let learnLan: Language;
    if (this.userService.user.jazyk) {
      // Get language currently learning
      const userLan = this.userService.user.jazyk.learnLan;
      learnLan = this.languages.find(lan => lan._id === userLan);
    }
    if (!learnLan) {
      // Get default language
      learnLan = this.languages[0];
    }
    this.selectedLanguage = learnLan;
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
