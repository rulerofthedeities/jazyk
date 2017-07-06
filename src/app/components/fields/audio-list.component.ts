import {Component, Input, Output, EventEmitter} from '@angular/core';
import {File} from '../../models/exercise.model';


@Component({
  selector: 'km-audio-list',
  template: `
    <ul class="list-group files">
      <li *ngFor="let audio of audios; let i=index" (click)="onClick(i)" class="list-group-item audio">
        <km-audio-file
          [fileName]="audio.s3">
        </km-audio-file>
        <span class="name">{{getLocalName(i)}}</span>
        <span class="marks">
          <span class="fa fa-check" *ngIf="isSelected(i)"></span>
          <span class="fa fa-times" *ngIf="!isSelected(i)"></span>
        </span>
      </li>
    </ul>
    <div class="clearfix"></div>
  `,
  styleUrls: ['files.css']
})
export class AudioListComponent {
  @Input() selected: string;
  @Input() audios: File[];
  @Output() clickedAudio = new EventEmitter<number>();

  onClick(i) {
    this.clickedAudio.emit(i);
  }

  isSelected(i: number): boolean {
    return this.audios[i].s3 === this.selected ? true : false;
  }

  getLocalName(i: number): string {
    let name = this.audios[i].local;

    if (name) {
      name = name.substring(3);
      let pos = name.indexOf('.');
      name = name.substring(0, pos !== -1 ? pos : name.length);
      pos = name.indexOf('#');
      name = name.substring(0, pos !== -1 ? pos : name.length);
    }

    return name;
  }
}
