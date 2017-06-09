import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {Course, Language, Translation} from '../../models/course.model';
import {config} from '../../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  template: `
  <button class="btn btn-success" (click)="onNewCourse()">
    {{text.newcourse}}
  </button>

  <!-- LANGUAGE -->
  <div class="form-group form-group-lg">
    <div class="col-xs-12 lanselector">
      <km-language-selector 
        [languages]="languages"
        [currentLanguage]="selectedLanguage"
        (languageSelected)="onLanguageSelected($event)">
      </km-language-selector>
    </div>
  </div>

  <div class="clearfix"></div>

  <!-- COURSE LIST -->
  <ul class="list-unstyled" *ngIf="courses">
    <li *ngFor="let course of courses">
      <km-course-summary
        [course]="course"
        [text]="text">
      </km-course-summary>
    </li>
  </ul>
  `,
  styles: [`
    .lanselector {
      padding: 0;
      margin-bottom: 1px;
    }
  `]
})

export class CoursesComponent implements OnInit, OnDestroy {
  private componentActive = true;
  selectedLanguage: Language;
  languages: Language[];
  courses: Course[];
  text: Object = {};

  constructor(
    private router: Router,
    private learnService: LearnService,
    private errorService: ErrorService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.languages = this.utilsService.getActiveLanguages();
    // TODO: get language for user
    this.selectedLanguage = this.languages[0];
    this.getTranslations();
  }

  onLanguageSelected(newLanguage: Language) {
    this.selectedLanguage = newLanguage;
    this.getCourses();
  }

  onNewCourse() {
    this.router.navigate(['/build/course/new', {lan: this.selectedLanguage._id}]);
  }

  private setText(translations: Translation[]) {
    const keys = ['newcourse', 'startcourse', 'updatecourse'];
    this.text = this.utilsService.getTranslatedText(translations, keys);
  }

  private getTranslations() {
    const lan = config.language.slice(0, 2);
    this.utilsService
    .fetchTranslations(lan, 'CoursesComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        this.getCourses();
        this.setText(translations);
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
