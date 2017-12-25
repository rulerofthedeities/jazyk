import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {Course, UserCourse, CourseListType} from '../../models/course.model';
import {UserService} from '../../services/user.service';
import {DashboardService} from '../../services/dashboard.service';
import {ErrorService} from '../../services/error.service';

interface BadgeData {
  review?: number;
  difficult?: number;
  exam?: number;
}

interface DoneData {
  words?: number,
  exercises?: number,
  total?: number
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
  @Input() tpe: CourseListType;
  @Input() lastActivity: string; // only for dashboard
  @Output() unsubscribe = new EventEmitter<string>();
  listType = CourseListType;
  percDone = 0;
  badgeData: BadgeData = {};
  doneData: DoneData = {};

  constructor(
    private router: Router,
    private userService: UserService,
    private dashboardService: DashboardService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.course.exercisesCount = this.course.totalCount - this.course.wordCount;
    if (this.tpe === CourseListType.Learn) {
      this.percDone = 0; // Todo : get count done
    }
    this.getCourseData();
  }

  onEditCourse() {
    this.router.navigate(['/build/course/' + this.course._id]);
  }

  onStartCourse() {
    if (this.course.isPublished) {
      this.userService.subscribeToCourse(this.course);
      this.router.navigate(['/learn/course/' + this.course._id]);
    }
  }

  onContinueCourse(step: string) {
    const steproute = step ? '/' + step : '';
    this.userService.continueCourse(this.course);
    console.log('go to course', '/learn/course/' + this.course._id + steproute);
    this.router.navigate(['/learn/course/' + this.course._id + steproute]);
  }

  onStopLearningCourse() {
    this.unsubscribe.emit(this.course._id);
  }

  isAuthor(authorIds: string[]): boolean {
    let isAuthor = false;
    if (authorIds && authorIds.length > 0) {
      const userId = this.userService.user._id;
      if (authorIds.find(authId => authId === userId)) {
        isAuthor = true;
      }
    }
    return isAuthor;
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
            this.percDone = 100 - Math.min(100, Math.max(0, Math.ceil((this.course.totalCount - this.doneData.total) / this.course.totalCount * 100)));
          } else {
            this.percDone = 0;
          }
        }
      },
      error => this.errorService.handleError(error)
    );

  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
