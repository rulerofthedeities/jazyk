import {Component, Input, Output, OnInit} from '@angular/core';

@Component({
  selector: 'km-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.css']
})
export class AutocompleteComponent implements OnInit {
  @Input() items: string[];
  @Input() currentItem: string;
  @Input() placeholder: string;
  @Input() maxList = 5;
  showItems: string[];
  showList = false;
  entry: string;

  ngOnInit() {
    if (this.currentItem) {
      this.entry = this.currentItem;
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
    if (this.items) {
      if (entry) {
        const regex = new RegExp(entry);
        this.showItems = this.items.filter(item => regex.test(item)).slice(-this.maxList);
      } else {
        this.showItems = this.items.slice(-this.maxList);
      }
    }
  }

  selectItem(i: number) {
    this.currentItem = this.items[i];
    this.entry = this.currentItem;
    this.showList = false;
  }

  setNewItem() {
    if (this.currentItem) {
      if (this.currentItem !== this.entry) {
        this.currentItem = this.items.filter(item => item === this.entry)[0];
      }
    }
    if (!this.currentItem) {
      // New item
      this.currentItem = this.entry;
    }
  }
}
