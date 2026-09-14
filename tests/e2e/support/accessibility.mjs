import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export async function expectNoAccessibilityViolations(page, include) {
  let audit = new AxeBuilder({ page }).withTags(WCAG_AA_TAGS);

  if (include) {
    audit = audit.include(include);
  }

  const { violations } = await audit.analyze();
  const summary = violations.map(({ help, id, impact, nodes }) => ({
    help,
    id,
    impact,
    nodes: nodes.map((node) => ({ html: node.html, target: node.target.join(' ') })),
  }));

  expect(summary).toEqual([]);
}

export async function expectVisibleFocus(locator) {
  await expect(locator).toBeFocused();

  const hasVisibleIndicator = await locator.evaluate((element) => {
    const style = globalThis.getComputedStyle(element);
    const hasOutline =
      style.outlineStyle !== 'none' &&
      style.outlineColor !== 'transparent' &&
      Number.parseFloat(style.outlineWidth) >= 2;
    const hasRing = style.boxShadow !== 'none';

    return hasOutline || hasRing;
  });

  expect(hasVisibleIndicator).toBe(true);
}
