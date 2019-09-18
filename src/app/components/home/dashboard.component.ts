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
        ticks: {
          min: 0,
          beginAtZero: true,
          precision: 0
        }
      }],
      xAxes: [{
          display: false
      }]
    }
  };
  chartLabels = [];
  chartType = 'line';
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
        {data: []}
      ];
      const startDay = new Date(progress.end),
            day = new Date();
      let dayStr: string,
          points: ProgressPoints,
          j: number;
      for (let i = 0; i < progress.days; i++) {
        j = progress.days - i - 1
        day.setDate(startDay.getDate() - i);
        dayStr = this.getDayString(day);
        this.chartLabels[j] = dayStr;
        points = progress.points.find(p => p.day === dayStr);
        this.chartData[0].data[j] = 0;
        if (points) {
          this.chartData[0].data[j] = points.points;
        }
      }
      this.chartData[0].backgroundColor = 'rgba(92, 184, 92, 0.6)';
      this.chartData[0].borderColor = 'rgba(92, 184, 92, 0.8)';
      this.chartData[0].pointBackgroundColor = 'rgba(242, 196, 15, 0.9)';
      this.chartData[0].pointBorderColor = 'rgba(102, 102, 102, 0.9)';
      this.chartData[0].pointHoverBackgroundColor = 'rgba(242, 196, 15, 1)';
      this.chartData[0].pointHoverBorderColor = 'rgba(102, 102, 102, 1)';
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
