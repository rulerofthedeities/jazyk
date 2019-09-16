import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { DashboardService } from '../../services/dashboard.service';
import { SummaryData, RecentBook } from '../../models/dashboard.model';
import { Message } from '../../models/user.model';
import { LicenseUrl } from '../../models/main.model';
import { ModalRanksComponent } from '../modals/modal-ranks.component';
import * as moment from 'moment';
import { takeWhile } from 'rxjs/operators';

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
  recent: RecentBook[];
  isLoadingRecent = false;
  isLoadingCommunication = false;
  isLoadingOverview = false;
  recentReady = false;
  isError = false;
  totalScore: number;
  rank: number;
  rankName: string;
  nextRank: number;
  nextRankName: string;
  toGoNextRank: number;
  hasNextRank: boolean;

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private sharedService: SharedService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getCounts();
    this.getRecent();
    this.getNotificationsAndMessages();
    this.observe();
  }

  onSelectMessage(i: number) {
    const tpe = this.communications[i].tpe;
    this.router.navigate(['/user/' + tpe + 's' + '/' + this.communications[i].id]);
  }

  onShowRankings(rankings: ModalRanksComponent) {
    rankings.showModal = true;
  }
/*
  getRank(): number {
    return this.sharedService.getRank(this.getTotal());
  }

  getRankName(): string {
    const gender = this.userService.user.main.gender || 'm';
    return this.text['rank' + this.getRank() + gender];
  }
*/
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

  private setTotalAndRank(score: number) {
    this.totalScore = score;
    this.rank = this.sharedService.getRank(score);
    const gender = this.userService.user.main.gender || 'm';
    this.rankName = this.text['rank' + this.rank + gender];
    const nextRank = this.sharedService.getNextRank(this.rank);
    if (nextRank) {
      this.hasNextRank = true;
      this.nextRankName = this.text['rank' + nextRank + gender];
      this.toGoNextRank = this.sharedService.getPointsToGo(score, nextRank);
    } else {
      this.hasNextRank = false;
    }
  }

  private getCounts() {
    this.isLoadingOverview = true;
    this.dashboardService
    .fetchCounts()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        this.summaryData = data;
        if (this.summaryData) {
          this.setTotalAndRank(this.summaryData.score || 0);
        }
        this.isLoadingOverview = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  private getRecent() {
    this.isLoadingRecent = true;
    this.dashboardService
    .fetchRecentBooks()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(books => {
      this.processRecent(books);
      this.isLoadingRecent = false;
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
      messages => {
        this.isLoadingCommunication = false;
        this.processCommunication(messages);
      },
      error => this.errorService.handleError(error)
    );
  }

  private processRecent(books: RecentBook[]) {
    // userBook is key, not Book!
    const publishedBooks = books.filter(b => b.book && b.book.isPublished), // filter out not published anymore
          recentBooks = publishedBooks.sort((a, b) => {
            const dtA = new Date(a.dt),
                  dtB = new Date(b.dt);
            return dtA < dtB ? 1 : (dtA > dtB ? -1 : 0);
          });
    this.recent = recentBooks.slice(0, 8);
    this.recentReady = true;
  }

  private processCommunication(messages: Message[]) {
    const communications = [];
    // Combine messages and notifcations
    messages.forEach(message => {
      communications.push({
        id: message._id,
        tpe: 'message',
        from: message.sender.userName,
        message: message.message,
        dt: message.dt,
        read: message.recipient.read
      });
    });
    /*
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
    */
    // Sort communications
    this.communications = communications.sort(function(a, b) {
      const dtA = new Date(a.dt),
            dtB = new Date(b.dt);
      return dtA < dtB ? 1 : (dtA > dtB ? -1 : 0);
    }).slice(0, 4);
  }

  private observe() {
    /*
    this.userService
    .notificationRead
    .subscribe(
      isAllRead => {
        // Refetch notification in case of a new welcome message
        this.getNotificationsAndMessages();
      }
    );
    */
    this.userService
    .messageRead
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(
      update => this.getNotificationsAndMessages()
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
