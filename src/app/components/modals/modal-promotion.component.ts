import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { PlatformService } from '../../services/platform.service';
import { Subscription, timer } from 'rxjs';

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

  constructor(
    private platform: PlatformService
  ) {}

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
    if (this.platform.isBrowser) {
      this.showModal = true;
      this.cheer.play();
      // Close modal after 5 secs
      const timerObservable = timer(5000, 0);
      this.subscription = timerObservable.subscribe(t => this.showModal = false);
    }
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
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
