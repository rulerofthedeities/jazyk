import {Component, Input, Output, OnInit} from '@angular/core';

interface Item {
  name: string;
  nr: number;
}

@Component({
  selector: 'km-autocomplete',
  template: `
    <div class="form-group form-group-lg selector">
      <div class="col-xs-12">
        <input 
          type="text" 
          class="form-control" 
          id="name" 
          autocomplete="off"
          [placeholder]="placeholder"
          [(ngModel)]="entry"
          (ngModelChange)="showItemList()"
          (click)="toggleItemList()"
          >
      </div>
    </div>
    <ul class="list-group dropdown" *ngIf="showList">
      <li *ngFor="let item of showItems"
        class="list-group-item"
        (click)="selectItem(item.nr - 1)">
        {{item.nr}}. {{item.name}}
      </li>
    </ul>
  `,
  styleUrls: ['./autocomplete.component.css']
})
export class AutocompleteComponent implements OnInit {
  @Input() items: Item[];
  @Input() currentItem: Item;
  @Input() placeholder: string;
  @Input() maxList = 5;
  showItems: Item[];
  showList = false;
  entry: string;

  ngOnInit() {
    if (this.currentItem) {
      this.entry = this.currentItem.name;
    }
    this.fetchList(this.entry);
  }

  showItemList() {
    this.setNewItem();
    this.fetchList(this.entry);
    this.showList = true;
  }

  hideItemList() {
    this.showList = false;
  }

  toggleItemList() {
    this.showList = !this.showList;
  }

  fetchList(entry: string) {

    if (entry) {
      const regex = new RegExp(entry);
      this.showItems = this.items.filter(item => regex.test(item.name)).slice(-this.maxList);
    } else {
      this.showItems = this.items.slice(-this.maxList);
    }
  }

  selectItem(i: number) {
    this.currentItem = this.items[i];
    this.entry = this.currentItem.name;
    this.showList = false;
  }

  setNewItem() {
    if (this.currentItem) {
      if (this.currentItem.name !== this.entry) {
        this.currentItem = this.items.filter(item => item.name === this.entry)[0];
      }
    }
    if (!this.currentItem) {
      // New item
      this.currentItem = {nr: this.items.length + 1, name: this.entry};
    }
  }
}
