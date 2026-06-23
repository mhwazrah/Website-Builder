import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';

/**
 * Default entrance animation: fades/slides an element in the first time it
 * scrolls into view. Applied automatically to every public section (not user
 * configurable). Honours `prefers-reduced-motion` via CSS.
 *
 * Robustness: content is NEVER left hidden. If IntersectionObserver is missing
 * or never fires (some headless/embedded browsers throttle it), a short fallback
 * timer reveals the element anyway.
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective implements AfterViewInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    node.classList.add('reveal-init');

    const reveal = () => node.classList.add('reveal-in');

    if (typeof IntersectionObserver === 'undefined') {
      requestAnimationFrame(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
            obs.unobserve(node);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(node);

    // Safety net for environments where the observer is throttled and doesn't
    // fire for an element that is ALREADY on screen. We only force-reveal in
    // that case; sections still below the fold keep `reveal-init` and remain
    // observed, so they animate properly when scrolled into view.
    setTimeout(() => {
      if (node.classList.contains('reveal-in')) return;
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        reveal();
        observer.disconnect();
      }
    }, 1000);
  }
}
