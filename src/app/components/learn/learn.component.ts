import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {Course, Language, Translation} from '../../models/course.model';
import {config} from '../../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  template: `
    <pre>
      {{translations|json}}
      {{course|json}}
    </pre>

    <div *ngIf="course">
      {{course.name}} - {{text.Chapter}} 
    </div>

    <km-info-msg
      [msg]="infoMsg">
    </km-info-msg>
    <km-error-user-msg
      [msg]="errorMsg">
    </km-error-user-msg>
  `
})

export class LearnComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private courseId: string;
  errorMsg: string;
  infoMsg: string;
  course: Course;
  text: Object = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learnService: LearnService,
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['id']) {
          this.courseId = params['id'];
          this.getTranslations();
        }
      }
    );
  }

  private setText(translations: Translation[]) {
    const keys = ['Chapter'];
    this.text = this.utilsService.getTranslatedText(translations, keys);
  }

  private getTranslations() {
    const lan = config.language.slice(0, 2);
    this.utilsService
    .fetchTranslations(lan, 'LearnComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        this.getCourse(translations, this.courseId);
        this.setText(translations);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getCourse(translations: Translation[], courseId: string) {
    this.learnService
    .fetchCourse(courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      course => {
        if (course) {
          if (course.isPublished) {
            this.course = course;
          } else {
            this.infoMsg = this.utilsService.getTranslation(translations, 'notpublished');
          }
        } else {
          this.errorMsg = this.errorService.userError({code: 'learn01', src: courseId});
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
