import {Component, OnInit, OnDestroy} from '@angular/core';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {Notification} from '../../models/user.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'notifications.component.html',
  styleUrls: ['notifications.component.css', 'user.css']
})

export class UserNotificationsComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  notifications: Notification[];
  currentNotification: Notification;

  constructor(
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.fetchNotifications();
  }

  onSelectNotification(i: number) {
    this.currentNotification = this.notifications[i];
    if (!this.currentNotification.message) {
      this.fetchNotification(i);
    }
  }

  onCloseNotification() {
    this.currentNotification = null;
  }

  private fetchNotifications() {
    this.userService
    .fetchNotifications()
    .takeWhile(() => this.componentActive)
    .subscribe(
      notifications => this.notifications = notifications,
      error => this.errorService.handleError(error)
    );
  }

  private fetchNotification(i: number) {
    this.userService
    .fetchNotification(this.notifications[i]._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      notification => {
        if (notification) {
          if (!notification.read) {
            this.setNotificationAsRead(i);
            this.userService.updateUnreadCount(false);
          }
          notification.read = true;
          this.notifications[i] = notification;
          this.currentNotification = notification;
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private setNotificationAsRead(i: number) {
    console.log('setting notification as read');
    this.userService
    .setNotificationAsRead(this.notifications[i]._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      read => {},
      error => this.errorService.handleError(error)
    );
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.main.lan, 'UserComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
