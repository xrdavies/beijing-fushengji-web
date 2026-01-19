/**
 * IMEInput - Input wrapper with better IME/Chinese handling.
 */

import { Input } from '@pixi/ui';

export class IMEInput extends Input {
  private suppressNextKey = false;
  private suppressNextInput = false;
  private isComposing = false;
  private onCompositionStartBinding = () => {
    this.isComposing = true;
  };
  private onCompositionUpdateBinding = () => {
    this.isComposing = true;
  };
  private onCompositionEndBinding = (event: CompositionEvent) => {
    this.isComposing = false;
    if (!this.editing) {
      return;
    }
    const committed = event.data || this.input?.value || '';
    if (committed) {
      this._add(committed);
      this.suppressNextKey = true;
      this.suppressNextInput = true;
      this.clearNativeInput();
    }
  };

  protected onInput(e: InputEvent): void {
    if (!this.editing) {
      this.lastInputData = e.data ?? '';
      return;
    }

    if (this.suppressNextInput) {
      this.suppressNextInput = false;
      this.clearNativeInput();
      return;
    }

    if (e.isComposing || this.isComposing || e.inputType === 'insertCompositionText') {
      return;
    }

    if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
      this._delete();
      this.suppressNextKey = true;
      this.clearNativeInput();
      return;
    }

    const data = e.data || this.input?.value || '';
    if (data) {
      this._add(data);
      this.suppressNextKey = true;
      this.clearNativeInput();
    } else {
      this.lastInputData = e.data ?? '';
    }
  }

  protected onKeyUp(e: KeyboardEvent): void {
    if (this.isComposing) {
      return;
    }
    if (this.suppressNextKey) {
      this.suppressNextKey = false;
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      this._delete();
      return;
    }

    if (e.key === 'Escape' || e.key === 'Enter') {
      this.stopEditing();
    }
  }

  protected createInputField(): void {
    super.createInputField();
    if (this.input) {
      this.input.addEventListener('compositionstart', this.onCompositionStartBinding);
      this.input.addEventListener('compositionupdate', this.onCompositionUpdateBinding);
      this.input.addEventListener('compositionend', this.onCompositionEndBinding);
    }
  }

  protected _add(key: string): void {
    if (!this.editing) {
      return;
    }

    const maxLength = this.options.maxLength;
    if (!maxLength) {
      this.value = this.value + key;
      this.onChange.emit(this.value);
      return;
    }

    const current = Array.from(this.value);
    const incoming = Array.from(key);
    const next = current.concat(incoming).slice(0, maxLength).join('');
    if (next === this.value) {
      return;
    }
    this.value = next;
    this.onChange.emit(this.value);
  }

  protected _delete(): void {
    if (!this.editing) {
      return;
    }
    const current = Array.from(this.value);
    if (current.length === 0) {
      return;
    }
    current.pop();
    this.value = current.join('');
    this.onChange.emit(this.value);
  }

  private clearNativeInput(): void {
    if (this.input) {
      this.input.value = '';
    }
  }
}
