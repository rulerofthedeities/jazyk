import { Component, OnInit, OnDestroy, ElementRef, Renderer2, ViewChild,
         ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { isDevMode } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { SharedService } from '../../services/shared.service';
import { PlatformService } from '../../services/platform.service';
import { EventMessage } from '../../models/error.model';
import { environment } from 'environments/environment';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.css']
})

export class FooterComponent implements OnInit, OnDestroy {
  private componentActive = true;
  eventMessages: EventMessage[] = [];
  text: Object;
  isReady = false;
  lastEventMessage: string;
  showLog = false;
  platformLabel: string;
  appVersion = environment.version;
  isBrowser = false;

  @ViewChild('log') logElement: ElementRef;
  @ViewChild('message') messageElement: ElementRef;

  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private errorService: ErrorService,
    private sharedService: SharedService,
    private platform: PlatformService,
    renderer: Renderer2
  ) {
    if (this.platform.isBrowser) {
      renderer.listen(document, 'click', (event) => {
        if (this.logElement && this.messageElement && !this.logElement.nativeElement.contains(event.target)) {
          // Check if the last log message is clicked
          if (!this.messageElement.nativeElement.contains(event.target)) {
            // Outside log, close log
            this.showLog = false;
            this.sharedService.detectChanges(this.cdr);
          }
        }
      });
    }
  }
  ngOnInit() {
    this.isBrowser = this.platform.isBrowser;
    if (this.platform.isBrowser) {
      // Client only code.
      this.platformLabel = 'CLIENT';
    }
    if (this.platform.isServer) {
      // Server only code.
      this.platformLabel = 'SERVER';
    }
    this.getTranslations(this.userService.user.main.lan);
    this.observeEventMessages();
    this.userService.interfaceLanguageChanged.subscribe(
      newLan => this.getTranslations(newLan)
    );
  }

  onToggleEvents() {
    this.showLog = !this.showLog;
    if (this.showLog) {
      this.eventMessages = this.sharedService.eventMessageList;
    }
  }

  onKeyPressed(key: string) {
    if (key === 'Escape') {
      this.showLog = false;
    }
  }

  onCloseLog() {
    this.showLog = false;
  }

  isEven(i: number) {
    return i % 2 === 0;
  }

  showSource(): boolean {
    return isDevMode();
  }

  private getTranslations(lan) {
    this.sharedService
    .fetchTranslations(lan, 'FooterComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.sharedService.getTranslatedText(translations);
          this.isReady = true;
          this.sharedService.detectChanges(this.cdr);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private observeEventMessages() {
    this.lastEventMessage = this.sharedService.lastEventMessage;
    this.sharedService.eventMessage.subscribe(
      (newMessage: EventMessage) => {
        this.lastEventMessage = newMessage.message;
        this.sharedService.detectChanges(this.cdr);
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
    if (this.cdr) {
      this.cdr.detach();
    }
  }
}
