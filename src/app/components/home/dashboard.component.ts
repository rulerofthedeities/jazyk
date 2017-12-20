import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {DashboardService} from '../../services/dashboard.service';
import {Message, Notification} from '../../models/user.model';
import * as moment from 'moment';

interface Learning {
  subscribed: number;
  unsubscribed: number;
  total: number;
}

interface SummaryData {
  score: number;
  coursesLearning: Learning;
}

interface CommunicationData {
  messages: Message[];
  notifications: Notification[];
}

interface Communication {
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
  }

  onSelectMessage(i: number) {
    const tpe = this.communications[i].tpe;
    this.router.navigate(['/user/' + tpe + 's']);
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
        future: "in %s",
        past: this.text["dtPast"] || '',
        s  : this.text["dts"] || '',
        ss : this.text["dtss"] || '',
        m:  this.text["dtm"] || '',
        mm: this.text["dtmm"] || '',
        h:  this.text["dth"] || '',
        hh: this.text["dthh"] || '',
        d:  this.text["dtd"] || '',
        dd: this.text["dtdd"] || '',
        M:  this.text["dtM"] || '',
        MM: this.text["dtMM"] || '',
        y:  this.text["dty"] || '',
        yy: this.text["dtyy"] || ''
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
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => this.summaryData = data,
      error => this.errorService.handleError(error)
    );
  }

  private getRecentCourses() {

  }

  private getNotificationsAndMessages() {
    this.dashboardService
    .fetchCommunication()
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => this.processCommunication(data),
      error => this.errorService.handleError(error)
    );
  }

  private processCommunication(data: CommunicationData) {
    const communications = [];
    data.messages.forEach(message => {
      communications.push({
        tpe: 'message',
        from: message.sender.userName,
        message: message.message,
        dt: message.dt,
        read: message.recipient.read
      });
    });
    data.notifications.forEach(notification => {
      communications.push({
        tpe: 'notification',
        from: 'jazyk',
        message: notification.title,
        dt: notification.dt,
        read: notification.read
      });
    });
    this.communications = communications.sort(function(a, b){
      var dtA = new Date(a.dt),
          dtB = new Date(b.dt);
      return dtA < dtB ? 1 : (dtA > dtB ? -1 : 0)
    }).slice(0, 4);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}