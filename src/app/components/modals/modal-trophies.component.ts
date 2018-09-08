import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Trophy } from '../../models/book.model';

@Component({
  selector: 'km-modal-trophies',
  templateUrl: 'modal-trophies.component.html',
  styleUrls: ['modal-trophies.component.css']
})

export class ModalTrophiesComponent implements OnInit, OnChanges {
  @Input() private trophies: Trophy[];
  @Input() text: Object;
  showModal = false;
  trophyList: string[][] = []; // trophies as shown on screen
  trophyListAll: string[][]; // all trophies

  ngOnInit() {
    const trophyList: string[][] = [];
    trophyList[0] = ['01', '02', '03'];
    trophyList[1] = ['11', '12', '13'];
    trophyList[2] = ['21', '22', '23'];
    trophyList[3] = ['31', '32', '33'];
    trophyList[4] = ['111', '112', '113'];
    trophyList[5] = ['121', '122', '123'];
    trophyList[6] = ['131', '132', '133'];
    this.trophyListAll = trophyList;
  }

  ngOnChanges() {
    this.checkActiveTrophies();
  }

  onKeyPressed(key: string) {
    if (key === 'Escape') {
      this.close();
    }
  }

  onClose() {
    this.close();
  }

  private checkActiveTrophies() {
    const trophyListUser = this.trophies.map(t => t.trophy);
    if (this.trophyListAll) {
      this.trophyListAll.forEach((trophies, i) => {
        this.trophyList[i] = [];
        trophies.forEach((trophy, j) => {
          if (this.isInArray(trophy, trophyListUser)) {
            this.trophyList[i][j] = trophy;
          } else {
            this.trophyList[i][j] = trophy.substring(0, trophy.length - 1) + '0';
          }
        });
      });
    }
  }

  private isInArray(value: string, array: string[]) {
    return array.indexOf(value) > -1;
  }

  private close() {
    this.showModal = false;
  }
}
