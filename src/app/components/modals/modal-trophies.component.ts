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
    trophyList.push(['901']);
    trophyList.push(['01', '02', '03']);
    trophyList.push(['41', '42', '43']);
    trophyList.push(['51', '52', '53']);
    trophyList.push(['11', '12', '13']);
    trophyList.push(['61', '62', '63']);
    trophyList.push(['71', '72', '73']);
    trophyList.push(['21', '22', '23']);
    trophyList.push(['31', '32', '33']);
    trophyList.push(['111', '112', '113']);
    trophyList.push(['121', '122', '123']);
    trophyList.push(['131', '132', '133']);
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
