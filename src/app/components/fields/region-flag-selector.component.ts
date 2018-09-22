import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'km-region-flag-selector',
  templateUrl: 'region-flag-selector.component.html',
  styleUrls: ['region-flag-selector.component.css']
})

export class RegionFlagSelectorComponent implements OnInit {
  @Input() lan: string; // default lan for flag
  @Input() region: string; // currently selected region
  @Input() regions: string[];
  @Output() newRegion = new EventEmitter<string>();
  showDropdown = false;
  hover: number;

  ngOnInit() {
    if (!this.region) {
      this.region = this.regions.length ? this.regions[0] : this.lan;
    }
  }

  onToggle() {
    if (this.regions.length) {
      this.showDropdown = !this.showDropdown;
    }
  }

  onLeave() {
    this.hover = null;
  }

  onHoverRegion(i: number) {
    this.hover = i;
  }

  onSelectRegion(newRegion: string) {
    this.region = newRegion;
    this.showDropdown = false;
    this.hover = null;
    this.newRegion.emit(newRegion);
  }
}
