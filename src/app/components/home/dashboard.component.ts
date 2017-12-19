import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {ErrorService} from '../../services/error.service';
import {DashboardService} from '../../services/dashboard.service';

interface Learning {
  subscribed: number;
  notSubscribed: number;
}

interface CountData {
  score: number;
  coursesLearning: Learning;
}

@Component({
  selector: 'km-dashboard',
  template: `Dashboard`
})

export class DashboardComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  private componentActive = true;
  countData: CountData;

  constructor(
    private dashboardService: DashboardService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getCounts();
    this.getRecentCourses();
    this.getNotificationsAndMessages();
  }

  private getCounts() {
    this.dashboardService
    .fetchCounts()
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => {this.countData = data; console.log('count data', data)},
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