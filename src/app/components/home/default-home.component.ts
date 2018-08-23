import {Component, Input, OnChanges} from '@angular/core';
import {appTitle} from '../../services/shared.service';

@Component({
  selector: 'km-home-default',
  templateUrl: 'default-home.component.html',
  styleUrls: ['default-home.component.css']
})

export class DefaultHomeComponent implements OnChanges {
  private componentActive = true;
  @Input() text: Object;
  title = '';
  giveATry = '';
  lines: string[] = [];
  showModules = false;
  showModule: boolean[] = [];

  ngOnChanges() {
    this.showModule['learn'] = false;
    this.showModule['read'] = false;
    this.showModule['teach'] = false;
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
  onShowModules() {
    this.showModules = true;
  }
  onShowModule(module: string) {
    console.log('show module', module);
    this.showModule[module] = true;
  }

  onHideModule() {
    console.log('hide module');
    this.showModule.forEach(m => false);
  }

 }
