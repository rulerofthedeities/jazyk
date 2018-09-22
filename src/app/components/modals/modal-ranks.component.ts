import { Component, Input, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'km-modal-ranks',
  templateUrl: 'modal-ranks.component.html',
  styleUrls: ['modal-ranks.component.css']
})

export class ModalRanksComponent implements OnInit {
  @Input() rank: number;
  @Input() text: Object;
  rankScores: number[];
  gender: string;
  showModal = false;

  constructor(
    private sharedService: SharedService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.rankScores = this.sharedService.rankScores;
    this.gender = this.userService.user.main.gender || 'm';
  }

  onKeyPressed(key: string) {
    if (key === 'Escape') {
      this.close();
    }
  }

  onClose() {
    this.close();
  }

  getRankName(rank: number): string {
    return this.text['rank' + rank + this.gender];
  }

  private close() {
    this.showModal = false;
  }
}
