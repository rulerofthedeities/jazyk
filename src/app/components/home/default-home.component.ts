import {Component, Input} from '@angular/core';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-home-default',
  templateUrl: 'default-home.component.html',
  styleUrls: ['default-home.component.css']
})

export class DefaultHomeComponent {
  private componentActive = true;
  @Input() text: Object;
}
