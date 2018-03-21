import {Component, OnInit, OnDestroy, ViewChild, HostListener, ElementRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
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
  showActions = false;
  isFromDashboard = false;

  @ViewChild('dropdown') el: ElementRef;
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.el && !this.el.nativeElement.contains(event.target)) {
      // Outside dropdown, close dropdown
      this.showActions = false;
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.fetchNotifications();
    this.getCurrentNotification();
  }

  onOpenActions() {
    this.showActions = !this.showActions;
  }

  onSelectNotification(i: number) {
    this.infoMsg = '';
    this.currentNotification = this.notifications[i];
    if (!this.currentNotification.message) {
      this.fetchNotification(this.notifications[i]._id, i);
    }
  }

  onDeleteNotification(notificationId: string) {
    this.infoMsg = '';
    this.notifications = this.notifications.filter(notification => notification._id !== notificationId);
    this.deleteNotification(notificationId);
    this.closeNotification(); // In case it was deleted from inside the message
  }

  onDeleteAllRead() {
    this.infoMsg = '';
    this.showActions = false;
    this.notifications = this.notifications.filter(notification => !notification.read);
    this.deleteReadNotifications();
  }

  onCloseNotification() {
    this.closeNotification();
  }

  onMarkAllRead() {
    this.infoMsg = '';
    this.showActions = false;
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
    if (this.isFromDashboard) {
      this.router.navigate(['/home']);
    } else {
      this.currentNotification = null;
      this.showActions = false;
    }
  }

  private getCurrentNotification() {
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['notificationId']) {
          this.isFromDashboard = true;
          this.fetchNotification(params['notificationId'], null);
        }
      }
    );
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

  private fetchNotification(id: string, i: number) {
    this.userService
    .fetchNotification(id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      notification => {
        if (notification) {
          if (i === null) {
            // look for current notification in array
            i = this.notifications.findIndex(notification => notification._id === id);
          }
          if (!notification.read) {
            this.setNotificationAsRead(i);
            this.userService.updateUnreadNotificationsCount(false);
          }
          notification.read = true;
          if (!isNaN(i)) {
            this.notifications[i] = notification;
          }
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
    if (!isNaN(i)) {
      this.userService
      .setNotificationAsRead(this.notifications[i]._id)
      .takeWhile(() => this.componentActive)
      .subscribe(
        read => {},
        error => this.errorService.handleError(error)
      );
    }
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
