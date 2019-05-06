import { Component, Input, OnInit, Output, EventEmitter, ElementRef, Renderer2 } from '@angular/core';
import { CompactProfile } from '../../models/user.model';
import { PlatformService } from '../../services/platform.service';

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

  constructor(
    elementRef: ElementRef,
    private platform: PlatformService,
    renderer: Renderer2
  ) {
    if (this.platform.isBrowser) {
      renderer.listen(document, 'click', (event) => {
        if (!elementRef.nativeElement.contains(event.target)) {
          // Outside dropdown, close dropdown
          this.showDropdown = false;
        }
      });
    }
  }

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
