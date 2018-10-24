import { Component, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { appTitle } from '../../services/shared.service';
import { DashboardService } from '../../services/dashboard.service';
import { HomeStats } from '../../models/dashboard.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-home-default',
  templateUrl: 'default-home.component.html',
  styleUrls: ['default-home.component.css']
})

export class DefaultHomeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() text: Object;
  private componentActive = true;
  title = '';
  giveATry = '';
  lines: string[] = [];
  showModules = false;
  currentModule: string;
  moduleText: string;
  isLoadingStats = false;
  stats: HomeStats;

  constructor(
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    // this.getStats();
  }

  ngOnChanges() {
    this.currentModule = null;
    this.moduleText = '';
    if (this.text['homeTitle']) {
      let title = this.text['homeTitle'];
      title = title.replace('%s', appTitle);
      this.title = title;
      let line = this.text['homeLine0'];
      line = line.replace('%s', appTitle);
      this.lines = [];
      this.lines.push(line);
      this.lines.push(this.text['homeLine1']);
      this.lines.push(this.text['homeLine2']);
      this.lines.push(this.text['homeLine3']);
      const giveATry = this.text['Givejazyk'];
      this.giveATry = giveATry.replace('%s', appTitle);
    }
  }

  onShowModule(module: string) {
    this.currentModule = module.toLocaleLowerCase();
    this.moduleText = this.text[module + 'Text'];
    this.showModules = true;
  }

  onGoToRoute(route: string) {
    this.router.navigate(['/' + route]);
  }

  onHideModules() {
    this.currentModule = null;
    this.showModules = false;
  }

  private getStats() {
    this.isLoadingStats = true;
    this.dashboardService
    .fetchHomeStats()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (stats: HomeStats) => {
        this.isLoadingStats = false;
        this.stats = stats;
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
 }
