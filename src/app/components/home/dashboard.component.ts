import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { DashboardService } from '../../services/dashboard.service';
import { SummaryData, RecentBook, Progress, ProgressPoints } from '../../models/dashboard.model';
import { LicenseUrl } from '../../models/main.model';
import { ModalRanksComponent } from '../modals/modal-ranks.component';
import { takeWhile } from 'rxjs/operators';

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
  recent: RecentBook[];
  isLoadingRecent = false;
  isLoadingProgress = false;
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
  hasChartData: boolean;
  chartOptions = {
    scaleShowVerticalLines: false,
    responsive: false,
    scales: {
      yAxes: [{
        stacked: true,
        ticks: {
          min: 0,
          beginAtZero: true,
          precision: 0
        }
      }],
      xAxes: [{
        stacked: true,
        display: false
      }]
    },
    legend: {
      display: true,
      labels: {
        fontColor: 'rgb(255, 99, 132)'
      }
    }
  };
  chartLabels = [];
  chartType = 'bar';
  chartLegend = false;
  chartData = null;

  constructor(
    private dashboardService: DashboardService,
    private sharedService: SharedService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getCounts();
    this.getProgress();
    this.getRecent();
  }

  onShowRankings(rankings: ModalRanksComponent) {
    rankings.showModal = true;
  }

  getRank(): number {
    return this.sharedService.getRank(this.getTotal());
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

  private getProgress() {
    // get points for last 7 days
    this.isLoadingProgress = true;
    this.dashboardService
    .fetchProgress()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe((progress: Progress) => {
      this.isLoadingProgress = false;
      this.processChartData(progress);
    });
  }

  private processChartData(progress: Progress) {
    this.hasChartData = false;
    if (progress) {
      this.chartData = [
        {
          data: [],
          label: this.text['chart-read']
        },
        {
          data: [],
          label: this.text['chart-listen']
        },
        {
          data: [],
          label: this.text['chart-glossary']
        },
        {
          data: [],
          type: 'line',
          label: this.text['chart-total']
        }
      ];
      const startDay = new Date(progress.end),
            day = new Date();
      let dayStr: string,
          points: ProgressPoints,
          pointsArr: ProgressPoints[],
          j: number;
      for (let i = 0; i < progress.days; i++) {
        j = progress.days - i - 1
        day.setDate(startDay.getDate() - i);
        dayStr = this.getDayString(day);
        this.chartLabels[j] = dayStr;
        pointsArr = progress.points.filter(p => p.day === dayStr);
        this.chartData[0].data[j] = 0;
        this.chartData[1].data[j] = 0;
        this.chartData[2].data[j] = 0;
        if (pointsArr) {
          points = pointsArr.find(p => p.type === 'read');
          if (points) {
            this.chartData[0].data[j] = points.points;
          }
          points = pointsArr.find(p => p.type === 'listen');
          if (points) {
            this.chartData[1].data[j] = points.points;
          }
          points = pointsArr.find(p => p.type === 'glossary');
          if (points) {
            this.chartData[2].data[j] = points.points;
          }
          // Total line
          this.chartData[3].data[j] = pointsArr.reduce((total, num) => total + num.points, 0);
        }
      }
      this.chartData[0].backgroundColor = 'rgba(129, 166, 214, 0.8)';
      this.chartData[0].borderColor = 'rgba(81, 139, 241, 0.8)';
      this.chartData[0].hoverBackgroundColor = 'rgba(129, 166, 214, 1)';
      this.chartData[0].hoverBorderColor = 'rgba(81, 139, 241, 1)';
      this.chartData[0].pointBackgroundColor = 'rgba(81, 139, 241, 0.9)';
      this.chartData[0].pointBorderColor = 'rgba(102, 102, 102, 0.9)';
      this.chartData[0].pointHoverBackgroundColor = 'rgba(81, 139, 241, 1)';
      this.chartData[0].pointHoverBorderColor = 'rgba(102, 102, 102, 1)';
      this.chartData[1].backgroundColor = 'rgba(214, 183, 129, 0.8)';
      this.chartData[1].borderColor = 'rgba(214, 165, 81, 0.8)';
      this.chartData[1].hoverBackgroundColor = 'rgba(214, 183, 129, 1)';
      this.chartData[1].hoverBorderColor = 'rgba(214, 165, 81, 1)';
      this.chartData[1].pointBackgroundColor = 'rgba(214, 165, 81, 0.9)';
      this.chartData[1].pointBorderColor = 'rgba(102, 102, 102, 0.9)';
      this.chartData[1].pointHoverBackgroundColor = 'rgba(214, 165, 81, 1)';
      this.chartData[1].pointHoverBorderColor = 'rgba(102, 102, 102, 1)';
      this.chartData[2].backgroundColor = 'rgba(214, 140, 129, 0.8)';
      this.chartData[2].borderColor = 'rgba(214, 99, 81, 0.8)';
      this.chartData[2].hoverBackgroundColor = 'rgba(214, 140, 129, 1)';
      this.chartData[2].hoverBorderColor = 'rgba(214, 99, 81, 1)';
      this.chartData[2].pointBackgroundColor = 'rgba(214, 99, 81, 0.9)';
      this.chartData[2].pointBorderColor = 'rgba(102, 102, 102, 0.9)';
      this.chartData[2].pointHoverBackgroundColor = 'rgba(214, 99, 81, 1)';
      this.chartData[2].pointHoverBorderColor = 'rgba(102, 102, 102, 1)';
      this.chartData[3].backgroundColor = 'rgba(255, 255, 255, 0)';
      this.chartData[3].borderColor = 'rgba(92, 184, 92, 0.8)';
      this.chartData[3].hoverBackgroundColor = 'rgba(92, 184, 92, 0.8)';
      this.chartData[3].hoverBorderColor = 'rgba(92, 184, 92, 1)';
      this.hasChartData = true;
    }
  }

  private getDayString(day: Date): string {
    const year = day.getFullYear(),
          month = day.getMonth() + 1,
          date = day.getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
