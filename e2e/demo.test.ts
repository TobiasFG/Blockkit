import { expect, test } from '@playwright/test';

test('auth flow gates cms, signs up, enters dashboard, signs out', async ({ page }) => {
	const email = `playwright-${Date.now()}@blockkit.local`;
	const password = 'secret12';

	await page.goto('/');
	await expect(page).toHaveURL(/\/auth$/);
	await expect(page.getByRole('heading', { name: 'Editorial CMS' })).toBeVisible();

	await page.getByRole('button', { name: 'Sign up' }).first().click();
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Create account' }).click();

	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: 'Pages first. Shared content lives in the library.' })).toBeVisible();
	await expect(page.getByText(email)).toBeVisible();

	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL(/\/auth$/);
	await expect(page.getByRole('heading', { name: 'Editorial CMS' })).toBeVisible();
});
