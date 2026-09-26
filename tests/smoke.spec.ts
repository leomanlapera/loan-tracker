import { test, expect } from '@playwright/test'

test.describe('public surface', () => {
  test('landing page renders CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Loan Tracker/i)
    await expect(page.getByRole('heading', { name: /track private loans/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /^get started$/i })).toBeVisible()
  })

  test('/login renders sign-in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/^log in$/i).first()).toBeVisible()
    await expect(page.locator('input#email')).toBeVisible()
    await expect(page.locator('input#password')).toBeVisible()
  })

  test('/sign-up renders account-creation form', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page.getByText(/create your account/i).first()).toBeVisible()
    await expect(page.locator('input#displayName')).toBeVisible()
    await expect(page.locator('input#email')).toBeVisible()
    await expect(page.locator('input#password')).toBeVisible()
  })

  test('/reset-password renders request form', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByText(/reset your password/i).first()).toBeVisible()
  })

  test('/privacy is public', async ({ page }) => {
    const resp = await page.goto('/privacy')
    expect(resp?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: /privacy notice/i })).toBeVisible()
  })

  test('/terms is public', async ({ page }) => {
    const resp = await page.goto('/terms')
    expect(resp?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: /terms of use/i })).toBeVisible()
  })
})

test.describe('auth gate', () => {
  const protectedPaths = [
    '/dashboard',
    '/borrowers',
    '/borrowers/new',
    '/loans',
    '/loans/new',
    '/reports',
    '/reports/portfolio',
    '/activity',
    '/settings',
  ] as const

  for (const path of protectedPaths) {
    test(`${path} redirects unauthenticated user to /login`, async ({ page }) => {
      await page.goto(path)
      // Either middleware (with ?next=) or the app-layout guard (without) may win
      // the race. Both end at /login — that's the acceptance criterion.
      await expect(page).toHaveURL(/\/login/)
    })
  }
})
