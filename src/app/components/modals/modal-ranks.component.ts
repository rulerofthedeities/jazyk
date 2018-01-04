import {Component, Input, OnInit} from '@angular/core';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'km-modal-ranks',
  templateUrl: 'modal-ranks.component.html',
  styleUrls: ['modal-ranks.component.css']
})

export class ModalRanksComponent implements OnInit{
  @Input() rank: number;
  @Input() text: Object;
  rankScores: number[];
  gender: string;
  showModal = false;

  constructor(
    private utilsService: UtilsService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.rankScores = this.utilsService.getRankScores();
    this.gender = this.userService.user.main.gender || 'm';
  }

  getRankName(rank: number): string {
    return this.text['rank' + rank + this.gender];
  }

  onClose() {
    this.showModal = false;
  }
}
