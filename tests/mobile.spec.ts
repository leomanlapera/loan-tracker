import { test, expect } from '@playwright/test'

/**
 * PRD §9: mobile-first. Verify no horizontal scroll at 375px width
 * (iPhone SE / smallest common target). Chromium-only project — set the
 * viewport manually rather than pulling in a webkit device descriptor.
 */
test.use({ viewport: { width: 375, height: 667 } })

const routes = ['/', '/login', '/sign-up', '/privacy', '/terms']

for (const path of routes) {
  test(`${path} fits within 375px without horizontal scroll`, async ({ page }) => {
    await page.goto(path)
    const overflow = await page.evaluate(() => {
      const el = document.documentElement
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }
    })
    expect(
      overflow.scrollWidth,
      `${path} horizontal overflow: scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}`,
    ).toBeLessThanOrEqual(overflow.clientWidth + 1)
  })
}
