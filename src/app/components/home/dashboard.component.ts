import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UtilsService } from '../../services/utils.service';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { DashboardService } from '../../services/dashboard.service';
import { SummaryData, CommunicationData, RecentCourse, RecentBook } from '../../models/dashboard.model';
import { CourseListType, LicenseUrl } from '../../models/course.model';
import { ModalRanksComponent } from '../modals/modal-ranks.component';
import * as moment from 'moment';
import { zip } from 'rxjs';
import { takeWhile, delay } from 'rxjs/operators';

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
  @Input() licenses: LicenseUrl[];
  private componentActive = true;
  summaryData: SummaryData;
  communications: Communication[];
  recent: (RecentCourse|RecentBook)[];
  isLoadingRecent = false;
  isLoadingCommunication = false;
  isLoadingOverview = false;
  recentReady = false;
  isError = false;
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
    this.getRecent();
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
    this.isLoadingOverview = true;
    this.dashboardService
    .fetchCounts()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        this.isLoadingOverview = false;
        this.summaryData = data;
      },
      error => this.errorService.handleError(error)
    );
  }

  private getRecent() {
    this.isLoadingRecent = true;
    zip(
      this.dashboardService.fetchRecentCourses(),
      this.dashboardService.fetchRecentBooks()
    )
    .pipe(
      takeWhile(() => this.componentActive))
    .subscribe(res => {
      this.isLoadingRecent = false;
      // BOOKS data: userBook is key, not Book!
      this.processRecent(res[0], res[1]);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getNotificationsAndMessages() {
    this.isLoadingCommunication = true;
    this.dashboardService
    .fetchCommunication()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        this.isLoadingCommunication = false;
        this.processCommunication(data);
      },
      error => this.errorService.handleError(error)
    );
  }

  private processRecent(courses: RecentCourse[], books: RecentBook[]) {
    let data: (RecentCourse|RecentBook)[] = courses;
    const publishedBooks = books.filter(b => !!b.book.isPublished); // filter out not published anymore
    data = data.concat(publishedBooks);
    // Sort courses and books
    data = data.sort(function(a, b) {
      const dtA = new Date(a.dt),
            dtB = new Date(b.dt);
      return dtA < dtB ? 1 : (dtA > dtB ? -1 : 0);
    });
    this.recent = data.slice(0, 5);
    this.recentReady = true;
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
