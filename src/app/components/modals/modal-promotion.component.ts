import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs/rx';

@Component({
  selector: 'km-modal-promotion',
  templateUrl: 'modal-promotion.component.html',
  styleUrls: ['modal-promotion.component.css']
})

export class ModalPromotionComponent implements OnInit, OnDestroy {
  @Input() rankNr: number;
  @Input() rankName: string;
  @Input() gender: string;
  @Input() text: Object;
  private subscription: Subscription;
  showModal = false;
  cheer: any;

  ngOnInit() {
    this.cheer = this.loadAudio('/assets/audio/cheer.ogg');
  }

  onKeyPressed(key: string) {
    if (key === 'Escape') {
      this.close();
    }
  }

  onClose() {
    this.close();
  }

  doShowModal() {
    this.showModal = true;
    this.cheer.play();
    // Close modal after 5 secs
    const timer = Observable.timer(5000, 0);
    this.subscription = timer.subscribe(t => this.showModal = false);
  }

  private loadAudio(file: string): any {
    const audio = new Audio();
    audio.src = file;
    audio.load();
    audio.volume = 0.1;
    return audio;
  }

  private close() {
    this.showModal = false;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
