import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {Course, Language, Translation} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  template: `
  <button class="btn btn-success" (click)="onNewCourse()">
    {{text["newcourse"]}}
  </button>

  <!-- COURSE LIST -->
  <ul class="list-unstyled" *ngIf="courses">
    <li *ngFor="let course of courses">
      <km-build-course-summary
        [course]="course"
        [text]="text">
      </km-build-course-summary>
    </li>
  </ul>
  <km-info-msg [msg]="infoMsg" *ngIf="infoMsg">
  </km-info-msg>`
})

export class BuildCoursesComponent implements OnInit, OnDestroy {
  private componentActive = true;
  courses: Course[];
  text: Object = {};
  infoMsg: string;

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
        console.log('user built courses', courses);
        this.courses = courses;
        if (courses && courses.length < 1) {
          this.infoMsg = this.text['NoBuiltCourses'];
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
