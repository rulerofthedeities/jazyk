import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {DashboardService} from '../../services/dashboard.service';

interface Learning {
  subscribed: number;
  unsubscribed: number;
  total: number;
}

interface SummaryData {
  score: number;
  coursesLearning: Learning;
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

  constructor(
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

  getRank(): number {
    return this.utilsService.getRank(this.getTotal());
  }

  getRankName(): string {
    const gender = this.userService.user.main.gender || 'm';
    return this.text['rank' + this.getRank() + gender];
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

  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}