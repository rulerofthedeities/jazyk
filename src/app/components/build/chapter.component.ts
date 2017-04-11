import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Lesson} from '../../models/course.model';

@Component({
  selector: 'km-chapter',
  template: `
  <div class="navbar navbar-default">
    <div class="navbar-header">
      <a href="#" (click)="onClick($event, 'open')" class="navbar-brand">
        <span class="fa" [ngClass]="{'fa-caret-down': isOpen, 'fa-caret-right': !isOpen}"></span>
      </a>
    </div>
    <div class="collapse navbar-collapse">
      <ul class="nav navbar-nav">
        <li><a href="#" (click)="onClick($event, 'open')">{{title}} ({{total}})</a></li>
      </ul>
      <ul class="nav navbar-nav navbar-right">
        <li>
          <a href="#" (click)="onClick($event, 'move')">
            <span class="fa fa-arrows"></span>
          </a>
        </li>
        <li>
          <a href="#" (click)="onClick($event, 'menu')">
            <span class="fa fa-bars"></span>
          </a>
        </li>
      </ul>
    </div>
    <div class="lessons" [ngStyle]="{display: isOpen ? 'block' : 'none'}">
      <ul class="lesson list-unstyled">
        <li *ngFor="let lesson of lessons">
          <div class="panel panel-default">
            <div class="panel-body">
              {{lesson.nr}}. {{lesson.name}}
              <button class="btn btn-lg btn-danger pull-right">Verwijder les</button>
              <button class="btn btn-lg btn-warning pull-right">Bewerk les</button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>`,
  styles: [`
    .navbar-default {
      background-color: #428bca;
      font-size: 22px;
    }

    .navbar-default .navbar-nav > li > a, .navbar-default .navbar-brand {
      color: white;
    }
    .panel {
      margin:0 5px 5px 5px;
    }
    .btn {
      margin-right: 4px;
    }
   `
  ]
})
export class BuildChapterComponent {
  @Input() lessons: Lesson[];
  @Input() title: string;
  @Input() total: number;
  @Input() isOpen: boolean;
  @Output() toggleOpen = new EventEmitter();

  onClick(e: any, action: string) {
    e.preventDefault();
    switch (action) {
      case 'open' : this.openChapter();
      break;
    }
  }

  openChapter() {
    this.toggleOpen.emit();
  }
}
