import {Component, Input, Output, OnInit, EventEmitter} from '@angular/core';

@Component({
  selector: 'km-keyboard',
  templateUrl: 'keyboard.component.html',
  styleUrls: ['keyboard.component.css']
})

export class LearnKeyboardComponent implements OnInit {
  @Input() keys: string[];
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
      this.keys.forEach((keyList, i) => {
        if (this.isUpperCase) {
          // keyList = keyList.toUpperCase(); // doesn't work for ß
          keyList = this.myToUpperCase(keyList);
        }
        this.rows[i] = keyList.split('');
      });
    }
  }

  private myToUpperCase = function(str) {
    var uppercase = '';
    str.split('').forEach((c, i) => {
      uppercase += String.fromCharCode(str.charCodeAt(i) & 223);
    });
    return uppercase;
  }
}
