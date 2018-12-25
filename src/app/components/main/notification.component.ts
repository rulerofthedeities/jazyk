import { Component, Input, PLATFORM_ID, Inject, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SharedService } from '../../services/shared.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-notification',
  templateUrl: 'notification.component.html',
  styleUrls: ['notification.component.css']
})

export class NotificationComponent implements OnInit, OnDestroy {
  @Input() notification = '';
  @Input() level = 'info'; // danger, warning, info
  @Input() tpe: string;
  @Input() lan = 'en';
  private componentActive = true;
  msg: string;
  btnText: string;
  isReady = false;

  constructor(
    private sharedService: SharedService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.getTranslations();
  }

  onAction() {
    if (this.tpe === 'refresh' && isPlatformBrowser(this.platformId)) {
      // Only Client Mode
      location.reload();
    }
  }

  getTranslations() {
    this.sharedService
    .fetchTranslations(this.lan, 'NotificationComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          const text = this.sharedService.getTranslatedText(translations);
          this.msg = text[this.notification];
          this.btnText = text['UpdateApp'];
          this.isReady = true;
        }
      }
    );
  }

  onClose() {
    this.sharedService
    .closeNotification();
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
