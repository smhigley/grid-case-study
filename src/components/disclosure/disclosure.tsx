
import { Component, Event, EventEmitter, Listen, Prop, State } from '@stencil/core';

@Component({
  tag: 'sui-disclosure',
  styleUrl: './disclosure.css',
  shadow: false
})
export class SuiDisclosure {
  /**
   * Optional override to the button's accessible name (using aria-label)
   */
  @Prop() buttonLabel: string;

  /**
   * Optionally set the popup region's accessible name using aria-label (recommended)
   */
  @Prop() popupLabel: string;

  /**
   * Emit a custom open event when the popup opens
   */
  @Event({
    eventName: 'open'
  }) openEvent: EventEmitter;

  /**
   * Emit a custom close event when the popup closes
   */
  @Event({
    eventName: 'close'
  }) closeEvent: EventEmitter;

  // whether the popup is open or closed
  @State() open = false;

  // Flag to set focus on next render completion
  private callFocus = false;

  // save reference to element that should receive focus
  private focusRef: HTMLElement;

  // save reference to wrapper
  private parentRef: HTMLElement;


  componentDidUpdate() {
    if (this.callFocus === true && this.focusRef) {
      this.focusRef.focus();
      this.callFocus = false;
    }
  }

  @Listen('focusout')
  onBlur(event: FocusEvent) {
    const focusWithin = this.parentRef.contains(event.relatedTarget as HTMLElement);
    if (!focusWithin) {
      this.open = false;
    }
  }

  render() {
    const { buttonLabel, open, popupLabel } = this;

    return (
      <div class={{'disclosure': true, 'open': open}} ref={(el) => this.parentRef = el}>
        <button
          aria-expanded={`${open}`}
          aria-label={buttonLabel !== undefined ? buttonLabel : null}
          class="trigger"
          ref={(el) => open ? null : this.focusRef = el}
          onClick={this.onButtonClick.bind(this)}
        >
          <slot name="button" />
        </button>
        <div
          aria-label={popupLabel || null}
          class="popup"
          role="region"
          onKeyDown={this.onPopupKeyDown.bind(this)}
        >
          <button class="close" ref={(el) => open ? this.focusRef = el : null} onClick={this.onCloseClick.bind(this)}>
            <span class="visuallyHidden">close</span>
          </button>
          <slot name="popup" />
        </div>
      </div>
    );
  }

  private onButtonClick() {
    const wasOpen = this.open;
    this.open = !wasOpen;

    // send focus into the popup on open
    if (!wasOpen) {
      this.callFocus = true;
    }
  }

  private onCloseClick() {
    this.open = false;
    this.callFocus = true;
  }

  private onPopupKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.open = false;
      this.callFocus = true;
      event.stopPropagation();
    }
  }
}