import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {Course, UserCourse, CourseListType, AccessLevel} from '../../models/course.model';
import {UserService} from '../../services/user.service';
import {UtilsService} from '../../services/utils.service';
import {DashboardService} from '../../services/dashboard.service';
import {SharedService} from '../../services/shared.service';
import {ErrorService} from '../../services/error.service';

interface BadgeData {
  review?: number;
  difficult?: number;
  exam?: number;
}

interface DoneData {
  words?: number;
  exercises?: number;
  total?: number;
}

@Component({
  selector: 'km-course-summary',
  templateUrl: 'course-summary.component.html',
  styleUrls: ['course-summary.component.css']
})

export class LearnCourseSummaryComponent implements OnInit, OnDestroy {
  private componentActive = true;
  @Input() course: Course;
  @Input() userData: UserCourse = null;
  @Input() text: {};
  @Input() isDemo = false;
  @Input() showAccess = false;
  @Input() tpe: CourseListType;
  @Input() lastActivity: string; // only for dashboard
  @Output() unsubscribe = new EventEmitter<string>();
  listType = CourseListType;
  percDone = 0;
  isSubscribed = false;
  showCourseDetails = false;
  badgeData: BadgeData = {};
  doneData: DoneData = {};
  defaultImage: string;
  regionTo: string;
  awsPath: string;

  constructor(
    private router: Router,
    private userService: UserService,
    private dashboardService: DashboardService,
    private utilsService: UtilsService,
    private sharedService: SharedService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.course.exercisesCount = this.course.totalCount - this.course.wordCount;
    this.percDone = 0;
    this.defaultImage = this.getDefaultImagePath();
    if (!this.course.isDemo) {
      if (this.tpe === CourseListType.Learn || this.tpe === CourseListType.Home) {
        this.getCourseData();
      }
      if (this.tpe === CourseListType.All) {
        this.checkIfCourseIsFollowed();
      }
    }
  }

  onEditCourse() {
    this.router.navigate(['/build/course/' + this.course._id]);
  }

  onStartCourse() {
    if (this.course.isPublished) {
      this.userService.subscribeToCourse(this.course);
      this.log(`Start course '${this.course.name}'`);
      this.router.navigate(['/learn/course/' + this.course._id]);
    }
  }

  onContinueCourse(step: string) {
    const steproute = step ? '/' + step : '';
    this.userService.continueCourse(this.course);
    this.log(`Go to course '${this.course.name}' (${step})`);
    this.router.navigate(['/learn/course/' + this.course._id + steproute]);
  }

  onStopLearningCourse() {
    this.unsubscribe.emit(this.course._id);
  }

  onToggleDetails() {
    this.showCourseDetails = !this.showCourseDetails;
  }

  isUser(): boolean {
    return !!this.userService.user.email;
  }

  isAuthor(): boolean {
    return this.userService.hasAccessLevel(this.course.access, AccessLevel.Author);
  }

  getAccessLevel(): string {
    const level = this.userService.getAccessLevel(this.course.access);
    return this.text[AccessLevel[level]];
  }

  private getCourseData() {
    // Stepcount
    this.dashboardService
    .fetchCourseSteps(this.course._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => {
        if (data) {
          this.badgeData.review = data.review;
          this.badgeData.difficult = data.difficult;
        }
      },
      error => this.errorService.handleError(error)
    );
    // Count words done
    this.dashboardService
    .fetchCourseDone(this.course._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => {
        if (data) {
          this.doneData.words = data[0];
          this.doneData.exercises = data[1];
          this.doneData.total = data[0] + data[1];
          if (this.doneData.total > 0) {
            const percDone = Math.ceil((this.course.totalCount - this.doneData.total) / this.course.totalCount * 100);
            this.percDone = 100 - Math.min(100, Math.max(0, percDone));
          } else {
            this.percDone = 0;
          }
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private checkIfCourseIsFollowed() {
    this.dashboardService
    .checkCourseFollowed(this.course._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      isSubscribed => {
        this.isSubscribed = !!isSubscribed;
      },
      error => this.errorService.handleError(error)
    );
  }

  private getDefaultImagePath(): string {
    const from = this.course.languagePair.from,
          path = this.utilsService.awsPath + 'images/courses/default/';
    this.regionTo = this.course.defaults.region || this.course.languagePair.to;
    return 'https://' + path + from + '-' + this.regionTo + '-course.jpg';
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'CourseSummaryComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
