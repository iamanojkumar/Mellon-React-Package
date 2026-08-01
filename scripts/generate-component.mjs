#!/usr/bin/env node
/**
 * Scaffolds the standard 5-file component set (Component.tsx, .module.css,
 * .test.tsx, .stories.tsx, index.ts) matching Box's conventions, and appends
 * the export line to src/components/index.ts.
 *
 * Usage: pnpm generate:component <Category> <ComponentName>
 * Example: pnpm generate:component Buttons Button
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';

const [, , category, name] = process.argv;

if (!category || !name) {
  console.error('Usage: pnpm generate:component <Category> <ComponentName>');
  console.error('Example: pnpm generate:component Buttons Button');
  process.exit(1);
}

if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
  console.error(`Component name must be PascalCase (got "${name}").`);
  process.exit(1);
}

const ROOT = process.cwd();
const componentDir = path.join(ROOT, 'src/components', name);

if (existsSync(componentDir)) {
  console.error(`src/components/${name} already exists.`);
  process.exit(1);
}

mkdirSync(componentDir, { recursive: true });

const lowerName = name.charAt(0).toLowerCase() + name.slice(1);

const files = {
  [`${name}.tsx`]: `import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './${name}.module.css';

export type ${name}Props<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<C>;

type ${name}Component = <C extends ElementType = 'div'>(
  props: ${name}Props<C>,
) => React.ReactElement | null;

export const ${name} = forwardRef(function ${name}<C extends ElementType = 'div'>(
  { as, className, ...rest }: ${name}Props<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';
  return (
    <Component ref={ref} className={mergeClasses(styles.${lowerName}, className)} {...rest} />
  );
}) as unknown as ${name}Component;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(${name} as any).displayName = '${name}';
`,

  [`${name}.module.css`]: `.${lowerName} {
  box-sizing: border-box;
}
`,

  [`${name}.test.tsx`]: `import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders as a div by default', () => {
    render(<${name} data-testid="${lowerName}">content</${name}>);
    expect(screen.getByTestId('${lowerName}').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<${name} as="section" data-testid="${lowerName}" />);
    expect(screen.getByTestId('${lowerName}').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<${name} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<${name} data-testid="${lowerName}" className="custom" />);
    expect(screen.getByTestId('${lowerName}').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<${name}>content</${name}>);
    await expectNoA11yViolations(container);
  });
});
`,

  [`${name}.stories.tsx`]: `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: '${category}/${name}',
  component: ${name},
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${name}>;

export const Default: Story = {
  args: {
    children: '${name} content',
  },
};
`,

  [`index.ts`]: `export { ${name} } from './${name}';
export type { ${name}Props } from './${name}';
`,
};

for (const [filename, content] of Object.entries(files)) {
  writeFileSync(path.join(componentDir, filename), content);
}

const barrelPath = path.join(ROOT, 'src/components/index.ts');
const barrel = readFileSync(barrelPath, 'utf8');
const exportLine = `export * from './${name}';`;
if (!barrel.includes(exportLine)) {
  appendFileSync(barrelPath, `${exportLine}\n`);
}

console.log(`Scaffolded src/components/${name}/ (category: ${category})`);
console.log(`Added "${exportLine}" to src/components/index.ts`);
console.log('Next: fill in real props/behavior — this is a blank polymorphic starting point.');
