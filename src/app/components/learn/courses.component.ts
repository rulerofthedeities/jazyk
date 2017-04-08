import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {Course, Language} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  template: `
    COURSES

  <button class="btn btn-success" (click)="onNewCourse()">
    Nieuwe cursus
  </button>

  <!-- LANGUAGE -->
  <div class="form-group form-group-lg">
    <div class="col-xs-12">
      <km-language-selector 
        [languages]="languages"
        [currentLanguage]="selectedLanguage"
        (languageSelected)="onLanguageSelected($event)">
      </km-language-selector>
    </div>
  </div>

<pre>{{courses|json}}</pre>
  `
})

export class CoursesComponent implements OnInit, OnDestroy {
  private componentActive = true;
  selectedLanguage: Language;
  languages: Language[];
  courses: Course[];

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
    this.getCourses();
  }

  onLanguageSelected(newLanguage: Language) {
    this.selectedLanguage = newLanguage;
    this.getCourses();
  }
  onNewCourse() {
    this.router.navigate(['/build/course/new', {lan: this.selectedLanguage._id}]);
    console.log('creating new course for', this.selectedLanguage._id);

  }

  getCourses() {
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
