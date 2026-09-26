import { test, expect } from '@playwright/test'

test.describe('public surface', () => {
  test('/ redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/login renders sign-in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/welcome back/i).first()).toBeVisible()
    await expect(page.locator('input#email')).toBeVisible()
    await expect(page.locator('input#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
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

  test('/sign-up no longer exists', async ({ page }) => {
    const resp = await page.goto('/sign-up')
    expect(resp?.status()).toBe(404)
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
      await expect(page).toHaveURL(/\/login/)
    })
  }
})
