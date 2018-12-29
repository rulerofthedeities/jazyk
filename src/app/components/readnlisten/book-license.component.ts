import { Component, Input, OnInit } from '@angular/core';
import { LicenseUrl } from '../../models/main.model';
import { Book } from '../../models/book.model';

@Component({
  selector: 'km-license',
  templateUrl: 'book-license.component.html'
})

export class BookLicenseComponent implements OnInit {
  @Input() private licenses: LicenseUrl[];
  @Input() private book: Book;
  @Input() text: Object;
  licenseUrl: string;
  toolTip: string;

  ngOnInit() {
    this.getLicenseUrl();
    this.setToolTip();
  }

  private getLicenseUrl() {
    if (this.licenses) {
      const license = this.licenses.find(l => this.book.license === l.license);
      if (license) {
        this.licenseUrl = license.url;
      }
    }
  }

  private setToolTip() {
    this.toolTip = this.text[this.book.license];
  }
}
