import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {Course, Language, Translation} from '../../models/course.model';
import {config} from '../../app.config';

@Component({
  template: `
    {{translations|json}}
    {{course|json}}
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
  private translations: Translation[];
  errorMsg: string;
  infoMsg: string;
  course: Course;

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

  getTranslation(key: string): string {
    const translation = this.translations.find( translation => translation.key === key);
    let txt = '';
    if (translation) {
      txt = translation.txt;
    }
    return txt;
  }

  private getTranslations() {
    const lan = config.language.slice(0, 2);
    this.utilsService
    .fetchTranslations(lan, 'LearnComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        this.translations = translations;
        this.getCourse(this.courseId);
      },
      error => this.errorService.handleError(error)
    )
  }

  private getCourse(courseId: string) {
    this.learnService
    .fetchCourse(courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      course => {
        if (course) {
          if (course.isPublished) {
            this.course = course;
          } else {
            this.infoMsg = this.getTranslation('notpublished');
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
