import { Component, Input, OnInit } from '@angular/core';
import { UserData } from '../../models/book.model';

@Component({
  selector: 'km-pie-chart',
  templateUrl: 'pie-chart.component.html',
  styles: [`
    .pie {width: 120px;}
    @media screen and (max-width: 991px) {
      .pie {width: 100px;}
    }`
  ]
})

export class PieChartComponent implements OnInit {
  @Input() private data: UserData;
  @Input() private testData: UserData;
  pathData: string[] = [];
  color: string[] = [];
  chartReady = false;
  totalData: UserData;

  ngOnInit() {
    this.calculatePieChart();
  }

  private calculatePieChart() {
    if (this.testData) {
      // Add data from test to read/listen test
      if (this.data) {
        this.totalData = {
          bookId: this.data.bookId,
          nrSentencesDone: this.data.nrSentencesDone + this.testData.nrSentencesDone,
          nrYes: this.data.nrYes + this.testData.nrYes,
          nrNo: this.data.nrNo + this.testData.nrNo,
          nrMaybe: this.data.nrMaybe + this.testData.nrMaybe,
          repeatCount: null,
          isTest: true
        };
      } else {
        // There is only test data
        this.totalData = this.testData;
      }
    } else {
      // there is only none-test data
      this.totalData = this.data;
    }
    // https://hackernoon.com/a-simple-pie-chart-in-svg-dbdd653b6936
    const total = this.totalData ? this.totalData.nrYes + this.totalData.nrNo + this.totalData.nrMaybe : 0;
    if (total > 0) {
      const slices = [
        { percent: this.totalData.nrYes / total, color: 'green' },
        { percent: this.totalData.nrMaybe / total, color: 'orange' },
        { percent: this.totalData.nrNo / total, color: 'red' },
      ];

      let cumulativePercent = 0;
      slices.forEach( (slice, i) => {
        const [startX, startY] = this.getCoordinatesForPercent(cumulativePercent);

        // each slice starts where the last slice ended, so keep a cumulative percent
        cumulativePercent += slice.percent;

        const [endX, endY] = this.getCoordinatesForPercent(cumulativePercent);

        // if the slice is more than 50%, take the large arc (the long way around)
        const largeArcFlag = slice.percent > .5 ? 1 : 0;

        // create an array and join it just for code readability
        this.pathData[i] = [
          `M ${startX} ${startY}`, // Move
          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
          `L 0 0`, // Line
        ].join(' ');
        this.color[i] = slice.color;
      });
      this.chartReady = true;
    }
  }

  private getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }
}
