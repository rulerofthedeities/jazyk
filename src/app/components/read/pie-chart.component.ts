import { Component, Input, OnInit } from '@angular/core';
import { UserData } from '../../models/book.model';

@Component({
  selector: 'km-pie-chart',
  templateUrl: 'pie-chart.component.html'
})

export class PieChartComponent implements OnInit {
  @Input() data: UserData;
  @Input() width = '120px';
  pathData: string[] = [];
  color: string[] = [];
  chartReady = false;

  ngOnInit() {
    this.calculatePieChart();
  }

  private calculatePieChart() {
    // https://hackernoon.com/a-simple-pie-chart-in-svg-dbdd653b6936
    const total = this.data ? this.data.nrYes + this.data.nrNo + this.data.nrMaybe : 0;
    if (total > 0) {
      const slices = [
        { percent: this.data.nrYes / total, color: 'green' },
        { percent: this.data.nrMaybe / total, color: 'orange' },
        { percent: this.data.nrNo / total, color: 'red' },
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
