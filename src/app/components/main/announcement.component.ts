import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { PlatformService } from '../../services/platform.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-announcement',
  templateUrl: 'announcement.component.html',
  styleUrls: ['announcement.component.css']
})

export class AnnouncementComponent implements OnInit, OnDestroy {
  @Input() announcement = '';
  @Input() level = 'info'; // danger, warning, info
  @Input() tpe: string;
  @Input() lan = 'en';
  private componentActive = true;
  msg: string;
  btnText: string;
  isReady = false;

  constructor(
    private sharedService: SharedService,
    private platform: PlatformService
  ) {}

  ngOnInit() {
    this.getTranslations();
  }

  onAction() {
    if (this.tpe === 'refresh' && this.platform.isBrowser) {
      // Only Client Mode
      location.reload();
    }
  }

  getTranslations() {
    this.sharedService
    .fetchTranslations(this.lan, 'AnnouncementComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          const text = this.sharedService.getTranslatedText(translations);
          this.msg = text[this.announcement];
          this.btnText = text['UpdateApp'];
          this.isReady = true;
        }
      }
    );
  }

  onClose() {
    this.sharedService
    .closeAnnouncement();
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
