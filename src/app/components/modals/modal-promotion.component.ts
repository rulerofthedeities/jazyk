import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-modal-promotion',
  templateUrl: 'modal-promotion.component.html',
  styleUrls: ['modal-promotion.component.css']
})

export class ModalPromotionComponent {
  @Input() rankNr: number;
  @Input() rankName: string;
  showModal = false;
  cheer: any;

  ngOnInit() {
    this.cheer = this.loadAudio('/assets/audio/cheer.ogg');
  }

  onClose() {
    this.showModal = false;
  }

  doShowModal() {
    this.showModal = true;
    this.cheer.play();
    // Close modal after 10 secs
    setTimeout(() => {
      this.showModal = false;
    }, 10000);
  }

  private loadAudio(file: string): any {
    const audio = new Audio();
    audio.src = file;
    audio.load();
    audio.volume = 0.1;
    return audio;
  }

}
