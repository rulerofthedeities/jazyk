import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {DashboardService} from '../../services/dashboard.service';
import {SummaryData, CommunicationData, RecentCourse} from '../../models/dashboard.model';
import {CourseListType} from '../../models/course.model';
import {ModalRanksComponent} from '../modals/modal-ranks.component';
import * as moment from 'moment';
import {takeWhile, delay} from 'rxjs/operators';

interface Communication {
  id: string;
  tpe: string;
  from: string;
  message: string;
  dt: Date;
  read: boolean;
}

@Component({
  selector: 'km-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.css']
})

export class DashboardComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  private componentActive = true;
  summaryData: SummaryData;
  communications: Communication[];
  courses: RecentCourse[];
  isLoadingRecent = false;
  coursesReady = false;
  listType = CourseListType;

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getCounts();
    this.getRecentCourses();
    this.getNotificationsAndMessages();
    this.subscribe();
  }

  onSelectMessage(i: number) {
    const tpe = this.communications[i].tpe;
    this.router.navigate(['/user/' + tpe + 's' + '/' + this.communications[i].id]);
  }

  onShowRankings(rankings: ModalRanksComponent) {
    rankings.showModal = true;
  }

  getRank(): number {
    return this.utilsService.getRank(this.getTotal());
  }

  getRankName(): string {
    const gender = this.userService.user.main.gender || 'm';
    return this.text['rank' + this.getRank() + gender];
  }

  getFromNow(dt: Date): string {
    moment.updateLocale('en', {
      relativeTime : {
        future: 'in %s',
        past: this.text['dtPast'] || '',
        s  : this.text['dts'] || '',
        ss : this.text['dtss'] || '',
        m:  this.text['dtm'] || '',
        mm: this.text['dtmm'] || '',
        h:  this.text['dth'] || '',
        hh: this.text['dthh'] || '',
        d:  this.text['dtd'] || '',
        dd: this.text['dtdd'] || '',
        M:  this.text['dtM'] || '',
        MM: this.text['dtMM'] || '',
        y:  this.text['dty'] || '',
        yy: this.text['dtyy'] || ''
      }
    });
    return moment(dt).fromNow();
  }

  private getTotal(): number {
    if (this.summaryData) {
      return this.summaryData.score || 0;
    } else {
      return 0;
    }
  }

  private getCounts() {
    this.dashboardService
    .fetchCounts()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => this.summaryData = data,
      error => this.errorService.handleError(error)
    );
  }

  private getRecentCourses() {
    this.isLoadingRecent = true;
    this.dashboardService
    .fetchRecentCourses()
    .pipe(takeWhile(() => this.componentActive), delay(2000))
    .subscribe(
      data => {
        this.isLoadingRecent = false;
        this.processCourses(data);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getNotificationsAndMessages() {
    this.dashboardService
    .fetchCommunication()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => this.processCommunication(data),
      error => this.errorService.handleError(error)
    );
  }

  private processCourses(data: RecentCourse[]) {
    // Sort courses
    this.courses = data.sort(function(a, b) {
      const dtA = new Date(a.dt),
            dtB = new Date(b.dt);
      return dtA < dtB ? 1 : (dtA > dtB ? -1 : 0);
    });
    this.coursesReady = true;
  }

  private processCommunication(data: CommunicationData) {
    const communications = [];
    // Combine messages and notifcations
    data.messages.forEach(message => {
      communications.push({
        id: message._id,
        tpe: 'message',
        from: message.sender.userName,
        message: message.message,
        dt: message.dt,
        read: message.recipient.read
      });
    });
    data.notifications.forEach(notification => {
      communications.push({
        id: notification._id,
        tpe: 'notification',
        from: 'jazyk',
        message: notification.title,
        dt: notification.dt,
        read: notification.read
      });
    });
    // Sort communications
    this.communications = communications.sort(function(a, b) {
      const dtA = new Date(a.dt),
            dtB = new Date(b.dt);
      return dtA < dtB ? 1 : (dtA > dtB ? -1 : 0);
    }).slice(0, 4);
  }

  private subscribe() {
    this.userService.notificationRead
    .subscribe(
      isAllRead => {
        // Refetch notification in case of a new welcome message
        this.getNotificationsAndMessages();
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
