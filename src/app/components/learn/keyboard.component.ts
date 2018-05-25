import {Component, Input, Output, OnInit, EventEmitter} from '@angular/core';
import {KeyboardKeys} from '../../models/course.model';

@Component({
  selector: 'km-keyboard',
  templateUrl: 'keyboard.component.html',
  styleUrls: ['keyboard.component.css']
})

export class LearnKeyboardComponent implements OnInit {
  @Input() keys: KeyboardKeys;
  @Output() selectedKey = new EventEmitter<string>();
  rows: string[][] = [];
  isUpperCase = false;

  ngOnInit() {
    this.setKeys();
  }

  onClick(key: string) {
    this.selectedKey.emit(key);
  }

  onToggleCase() {
    this.isUpperCase = !this.isUpperCase;
    this.setKeys();
  }

  private setKeys() {
    if (this.keys) {
      const keys = this.isUpperCase ? this.keys.uppercase : this.keys.lowercase;
      keys.forEach((keyList, i) => {
        this.rows[i] = keyList.split('');
      });
    }
  }
}
