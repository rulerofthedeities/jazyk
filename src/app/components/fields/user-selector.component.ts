import {Component, Input, OnInit, Output, EventEmitter, HostListener, ElementRef} from '@angular/core';
import {CompactProfile} from '../../models/user.model';

@Component({
  selector: 'km-user-selector',
  templateUrl: 'user-selector.component.html',
  styleUrls: ['selector.css']
})
export class UserSelectorComponent implements OnInit {
  @Input() prefix: string;
  @Input() users: CompactProfile[];
  @Input() selectedUser: CompactProfile = null;
  @Input() disabled = false;
  @Output() userSelected = new EventEmitter<CompactProfile>();
  showDropdown = false;
  dataReady = false;
  gravatarSelected = 0; // To force recaching of gravatar
  selectedDropdown: string; // For color indicator of hovered language in dropdown

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      // Outside dropdown, close dropdown
      this.showDropdown = false;
    }
  }

  constructor(
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    if (!this.selectedUser) {
      this.selectedUser = this.users[0];
    }
    this.dataReady = true;
  }

  onToggleDropdown() {
    if (!this.disabled) {
      this.showDropdown = !this.showDropdown;
      this.selectedDropdown = this.selectedUser._id;
    }
  }

  onSelectUser(newUser: CompactProfile) {
    this.selectedUser = newUser;
    this.gravatarSelected = 1 - this.gravatarSelected;
    this.selectedDropdown = newUser._id;
    this.showDropdown = false;
    this.userSelected.emit(newUser);
  }

  onHoverUser(hoveredUser: CompactProfile) {
    this.selectedDropdown = hoveredUser._id;
  }
}
