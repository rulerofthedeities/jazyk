import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'km-region-flag-selector',
  templateUrl: 'region-flag-selector.component.html',
  styleUrls: ['region-flag-selector.component.css']
})

export class RegionFlagSelectorComponent {
  @Input() lan: string; // default lan for flag
  @Input() region: string; // currently selected region
  @Input() regions: string[];
  @Output() newRegion = new EventEmitter<string>();
  showDropdown = false;
  hover: number;

  getRegion() {
    if (this.region) {
      return this.region;
    } else {
      return this.lan;
    }
  }

  onToggle() {
    if (this.regions) {
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