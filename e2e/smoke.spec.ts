import { test, expect } from "@playwright/test";

test.describe("public pages smoke", () => {
  test("landing page renders hero and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /forge your skills/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /start solving free/i }),
    ).toBeVisible();
  });

  test("login page renders the credentials form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("register page renders the signup form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create account/i }),
    ).toBeVisible();
  });

  test("protected routes redirect anonymous users to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
