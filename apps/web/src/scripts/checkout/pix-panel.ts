import { renderSVG } from "uqr";

export interface PixPanelElements {
  qr: HTMLElement;
  copyButton: HTMLButtonElement;
  copyLabel: HTMLElement;
  timer: HTMLElement;
  status: HTMLElement;
  expired: HTMLElement;
}

const copiedFeedbackMs = 1800;

export class PixPanel {
  private code = "";
  private ticking: ReturnType<typeof setInterval> | undefined;
  private readonly idleCopyText: string;

  constructor(
    private readonly elements: PixPanelElements,
    private readonly texts: { copied: string; expiresIn: string },
  ) {
    this.idleCopyText = elements.copyLabel.textContent ?? "";
    elements.copyButton.addEventListener("click", () => void this.copy());
  }

  show(code: string, expiresAt: Date): void {
    this.code = code;
    this.elements.qr.innerHTML = renderSVG(code, { border: 0 });
    this.elements.status.hidden = false;
    this.elements.copyButton.hidden = false;
    this.elements.expired.hidden = true;
    this.startTimer(expiresAt);
  }

  expire(): void {
    this.stopTimer();
    this.elements.qr.innerHTML = "";
    this.elements.status.hidden = true;
    this.elements.copyButton.hidden = true;
    this.elements.timer.textContent = "";
    this.elements.expired.hidden = false;
  }

  stopTimer(): void {
    clearInterval(this.ticking);
  }

  private startTimer(expiresAt: Date): void {
    this.stopTimer();
    const render = () => {
      const seconds = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000));
      const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
      this.elements.timer.textContent = this.texts.expiresIn.replace("{time}", time);
    };
    render();
    this.ticking = setInterval(render, 1000);
  }

  private async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code);
    } catch {
      return;
    }
    this.elements.copyLabel.textContent = this.texts.copied;
    setTimeout(() => (this.elements.copyLabel.textContent = this.idleCopyText), copiedFeedbackMs);
  }
}
