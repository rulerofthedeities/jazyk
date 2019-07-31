import { Component, OnInit, Input } from '@angular/core';
import { LicenseUrl } from '../../models/main.model';

@Component({
  selector: 'km-license',
  templateUrl: 'book-license.component.html'
})

export class BookLicenseComponent implements OnInit {
  @Input() text: Object;
  @Input() license: string;
  @Input() licenses: LicenseUrl[];
  licenseUrl: string;

  ngOnInit() {
    this.setLicenseUrl();
  }

  private setLicenseUrl() {
    if (this.licenses) {
      const license = this.licenses.find(l => this.license === l.license);
      if (license) {
        this.licenseUrl = license.url;
      }
    }
  }
}
