import { Component, OnInit, Input } from '@angular/core';
import { Book } from 'app/models/book.model';
import { LicenseUrl } from '../../models/main.model';

@Component({
  selector: 'km-license',
  templateUrl: 'book-license.component.html'
})

export class BookLicenseComponent implements OnInit {
  @Input() text: Object;
  @Input() book: Book;
  @Input() licenses: LicenseUrl[];
  licenseUrl: string;

  ngOnInit() {
    this.setLicenseUrl();
  }

  private setLicenseUrl() {
    if (this.licenses) {
      const license = this.licenses.find(l => this.book.license === l.license);
      if (license) {
        this.licenseUrl = license.url;
      }
    }
  }
}
