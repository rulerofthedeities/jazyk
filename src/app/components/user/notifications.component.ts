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
  infoMsg: string;

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
    this.infoMsg = '';
    this.currentNotification = this.notifications[i];
    if (!this.currentNotification.message) {
      this.fetchNotification(i);
    }
  }

  onDeleteNotification(notificationId: string) {
    this.infoMsg = '';
    this.notifications = this.notifications.filter(notification => notification._id !== notificationId);
    this.deleteNotification(notificationId);
  }

  onDeleteAllRead() {
    this.infoMsg = '';
    this.notifications = this.notifications.filter(notification => !notification.read);
    this.deleteReadNotifications();
  }

  onCloseNotification() {
    this.closeNotification();
  }

  onMarkAllRead() {
    this.infoMsg = '';
    this.markAllRead();
    this.setAllNotificationsAsRead();
  }

  onKeyPressed(key: string) {
    if (key === 'Escape') {
      this.closeNotification();
    }
  }

  private markAllRead() {
    this.notifications.map(notification => notification.read = true);
    this.userService.updateUnreadNotificationsCount(true);
  }

  private closeNotification() {
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
            this.userService.updateUnreadNotificationsCount(false);
          }
          notification.read = true;
          this.notifications[i] = notification;
          this.currentNotification = notification;
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private deleteNotification(notificationId: string) {
    this.userService
    .deleteNotification(notificationId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      deleted => {
        this.infoMsg = this.text['NotificationDeleted'];
      },
      error => this.errorService.handleError(error)
    );
  }

  private deleteReadNotifications() {
    this.userService
    .deleteReadNotifications()
    .takeWhile(() => this.componentActive)
    .subscribe(
      deleted => {
        this.infoMsg = this.text['NotificationsDeleted'];
      },
      error => this.errorService.handleError(error)
    );
  }

  private setNotificationAsRead(i: number) {
    this.userService
    .setNotificationAsRead(this.notifications[i]._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      read => {},
      error => this.errorService.handleError(error)
    );
  }

  private setAllNotificationsAsRead() {
    this.userService
    .setAllNotificationsAsRead()
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
