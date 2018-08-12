import {Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild} from '@angular/core';
import {isDevMode} from '@angular/core';
import {UserService} from '../services/user.service';
import {UtilsService} from '../services/utils.service';
import {ErrorService} from '../services/error.service';
import {SharedService} from '../services/shared.service';
import {EventMessage} from '../models/error.model';
import {environment} from 'environments/environment';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'km-footer',
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
  appVersion = environment.version;

  @ViewChild('log') logElement: ElementRef;
  @ViewChild('message') messageElement: ElementRef;
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.logElement && this.messageElement && !this.logElement.nativeElement.contains(event.target)) {
      // Check if the last log message is clicked
      if (!this.messageElement.nativeElement.contains(event.target)) {
        // Outside log, close log
        this.showLog = false;
      }
    }
  }

  constructor(
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.getTranslations(this.userService.user.main.lan);
    this.observeEventMessages();
    this.userService.languageChanged.subscribe(
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
    this.utilsService
    .fetchTranslations(lan, 'FooterComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
          this.isReady = true;
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private observeEventMessages() {
    this.lastEventMessage = this.sharedService.lastEventMessage;
    this.sharedService.eventMessage.subscribe(
      (newMessage: EventMessage) => this.lastEventMessage = newMessage.message
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
