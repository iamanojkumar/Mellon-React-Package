import axe from 'axe-core';

export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      // jsdom has no layout/paint engine, so computed colors are unreliable —
      // Storybook's addon-a11y (running in a real browser) is the source of
      // truth for contrast instead.
      'color-contrast': { enabled: false },
      // Flags page content not contained in a landmark (<main>, <nav>, ...).
      // Meaningful for a whole page, not a component rendered in isolation
      // directly into a bare document.body with no surrounding page
      // structure — every unit test here would trip it regardless of the
      // component's own correctness. Real page structure is the consuming
      // app's responsibility, not this component library's.
      region: { enabled: false },
    },
  });

  if (results.violations.length > 0) {
    const message = results.violations
      .map((violation) => {
        const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
        return `${violation.id} (${violation.impact}): ${violation.help}\n  affected: ${targets}`;
      })
      .join('\n');
    throw new Error(`Accessibility violations found:\n${message}`);
  }
}
