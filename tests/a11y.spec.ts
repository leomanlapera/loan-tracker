import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Fail the build on `critical` or `serious` a11y violations for public routes.
 * `moderate` and `minor` are reported but not blocking during MVP.
 */
const routes = ['/', '/login', '/sign-up', '/reset-password', '/privacy', '/terms']

for (const path of routes) {
  test(`axe: ${path} has no critical/serious violations`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    if (blocking.length > 0) {
      console.log(JSON.stringify(blocking, null, 2))
    }
    expect(blocking, `axe found ${blocking.length} blocking violations on ${path}`).toEqual([])
  })
}
