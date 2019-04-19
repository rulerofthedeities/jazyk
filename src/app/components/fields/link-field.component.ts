import { Component, Input, OnInit } from '@angular/core';
import { linkSync } from 'fs';

interface Link {
  display: string;
  url: string;
}

@Component({
  selector: 'km-link-field',
  templateUrl: 'link-field.component.html',
  styleUrls: ['link-field.component.css']
})

export class LinkFieldComponent implements OnInit {
  @Input() private value: string;
  links: Link[] = [];

  ngOnInit() {
    if (this.value) {
      const values = this.value.split('|');
      let url: string,
          display: string,
          pos: number;
      values.forEach(value => {
        pos = value.indexOf('!http');
        if (pos > 1) {
          display = value.slice(0, pos);
          url = value.slice(pos - value.length + 1);
        } else {
          display = value;
          url = null;
        }
        this.links.push({
          display: display.trim(),
          url: url ? url.trim() : url
        });
      });
    }
  }
}
