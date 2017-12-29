import {Component, Input, Output, EventEmitter} from '@angular/core';
import {File} from '../../models/word.model';
import {RegionAudio} from '../../models/exercise.model';

@Component({
  selector: 'km-audio-list',
  templateUrl: 'audio-list.component.html',
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

  getRegionAudio(audio: File): RegionAudio {
    return {
      s3: audio.s3,
      region: audio.local.substr(0, 2)
    };
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
