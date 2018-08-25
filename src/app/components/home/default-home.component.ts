import { Component, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { appTitle } from '../../services/shared.service';

@Component({
  selector: 'km-home-default',
  templateUrl: 'default-home.component.html',
  styleUrls: ['default-home.component.css']
})

export class DefaultHomeComponent implements OnChanges {
  @Input() text: Object;
  title = '';
  giveATry = '';
  lines: string[] = [];
  showModules = false;
  currentModule: string;
  moduleText: string;

  constructor(
    private router: Router
  ) {}

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
      this.lines.push(this.text['homeLineRead']);
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

 }
