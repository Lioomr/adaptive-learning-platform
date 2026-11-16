import { test, expect } from "@playwright/test";
import path from "node:path";
const evidence = path.resolve("../Advisor-Mahmoud/evidence");
test("all screens render in English and Arabic at desktop, tablet and mobile widths", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [1440, 834, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const screen of ["ad1", "ad2", "ad3", "ad4", "ad5", "ad6"]) {
      await page.goto(`/advisor/${screen}`);
      await expect(page.locator("h1:visible")).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBeTruthy();
      if (width === 1440)
        await page.screenshot({
          path: path.join(evidence, `${screen}-en-desktop.png`),
          fullPage: true,
          animations: "disabled",
        });
      await page.getByRole("button", { name: "العربية", exact: true }).click();
      await expect(page.locator("main:visible")).toContainText("طلاب");
      expect(
        await page
          .locator("main:visible")
          .evaluate((el) => getComputedStyle(el).direction),
      ).toBe("rtl");
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBeTruthy();
      if (width === 1440 || width === 390)
        await page.screenshot({
          path: path.join(evidence, `${screen}-ar-${width}.png`),
          fullPage: true,
          animations: "disabled",
        });
    }
  }
  expect(errors).toEqual([]);
});
test("caseload search, filters, empty state and profile rationale work", async ({
  page,
}) => {
  await page.goto("/advisor");
  await expect(page).toHaveURL(/ad2/);
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await page
    .getByRole("textbox", { name: "Search students" })
    .fill("no such student");
  await expect(
    page.getByRole("heading", { name: "No students to show" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByLabel("Show", { exact: true }).selectOption("inactive");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("Youssef");
  await page.getByLabel("Show", { exact: true }).selectOption("all");
  await page.getByRole("textbox", { name: "Search students" }).fill("نور");
  await page.getByRole("link", { name: "Nour", exact: true }).click();
  await expect(page.locator("h1:visible")).toContainText("Nour");
  await expect(page.locator("#concept-PY-STACK:visible")).toContainText("55%");
  await expect(page.locator("#concept-PY-REC:visible")).toContainText("35%");
  await page
    .getByRole("link", { name: "Inspect supporting mastery" })
    .first()
    .click();
  await expect(page.locator("details[open]")).toHaveCount(1);
  await page.goto("/advisor/ad3?student=PRIVATE");
  await expect(
    page.getByRole("heading", { name: "Student unavailable" }),
  ).toBeVisible();
});
test("nudge preview, draft replacement, cancel, confirmation and shared history", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && !r.url().startsWith("http://127.0.0.1:3000"))
      external.push(r.url());
  });
  await page.goto("/advisor/ad4?student=S-NOUR");
  await page
    .getByLabel("Message", { exact: true })
    .fill("A carefully edited check-in.");
  await page.getByLabel("Template", { exact: true }).selectOption("1");
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep my draft" }).click();
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue(
    "A carefully edited check-in.",
  );
  await page
    .getByRole("button", { name: "Preview nudge", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Send nudge (simulated)", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByText("No nudges recorded for this student yet."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Send nudge (simulated)", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm simulated send" }).click();
  await expect(page.getByRole("status")).toContainText("Nudge recorded");
  await expect(page.getByText("Recorded · not delivered")).toHaveCount(1);
  await page.getByRole("link", { name: "Back to student" }).click();
  await expect(page.locator("h1:visible")).toContainText("Nour");
  await expect(
    page
      .locator("p:visible")
      .filter({ hasText: "A carefully edited check-in." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Prepare a nudge", exact: true })
    .click();
  await page.getByLabel("Message language").selectOption("ar");
  if (await page.getByRole("alertdialog").isVisible())
    await page.getByRole("button", { name: "Replace draft" }).click();
  await expect(page.getByLabel("Message", { exact: true })).toHaveAttribute(
    "dir",
    "rtl",
  );
  await page
    .getByRole("button", { name: "Preview nudge", exact: true })
    .click();
  await expect(page.locator("blockquote")).toContainText("مرحباً نور");
  await page.reload();
  await expect(
    page.getByText("No nudges recorded for this student yet."),
  ).toBeVisible();
  expect(external).toEqual([]);
});
test("onboarding acknowledgement and warning rule details", async ({
  page,
}) => {
  await page.goto("/advisor/ad1");
  await expect(
    page.getByRole("button", { name: "Open my caseload" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("link", { name: "Open my caseload" }).click();
  await expect(page).toHaveURL(/ad2/);
  await page
    .getByRole("link", { name: "Review warnings", exact: true })
    .click();
  await page
    .locator("main:visible")
    .getByLabel("Student", { exact: true })
    .selectOption("S-YOUSSEF");
  await expect(
    page.getByText(
      "No simulated activity for 14 days; the rule is 14 days or more.",
    ),
  ).toBeVisible();
  await page.getByRole("link", { name: "View profile", exact: true }).click();
  await expect(page.locator("h1:visible")).toContainText("Youssef");
  await page.getByRole("link", { name: "View plan", exact: true }).click();
  await expect(page.getByText("Readiness starts at 70%")).toBeVisible();
});
test("Student → Instructor → Advisor mastery, warning trends, context and reset stay consistent", async ({
  page,
}) => {
  await page.goto("/student");
  await page.getByRole("radio", { name: "A base case", exact: true }).check();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByTestId("mastery-after")).toHaveText("61%");
  await page.getByRole("link", { name: /Instructor IN1/ }).click();
  await expect(page).toHaveURL(/instructor/);
  await expect(
    page.getByRole("heading", { name: "Course overview", exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).toContainText("61%");
  await page.locator('a[href="/advisor"]:visible').first().click();
  await page.getByRole("link", { name: "Nour", exact: true }).click();
  await expect(page.locator("#concept-PY-REC:visible")).toContainText("61%");
  await expect(page.locator("#concept-PY-STACK:visible")).toContainText("55%");
  await page
    .getByRole("combobox", { name: "Caseload student" })
    .first()
    .click();
  await page.getByRole("option", { name: /Salma/ }).click();
  await expect(page.locator("h1:visible")).toContainText("Salma");
  await expect(page).toHaveURL(/student=S-SALMA/);
  await page
    .getByRole("combobox", { name: "Caseload student" })
    .first()
    .click();
  await page.getByRole("option", { name: /Nour/ }).click();
  await page
    .getByRole("combobox", { name: "Course", exact: true })
    .first()
    .click();
  await page.getByRole("option", { name: "Mathematics", exact: true }).click();
  await page.getByRole("link", { name: /Student ST1/ }).click();
  for (let i = 0; i < 2; i++) {
    if (i)
      await page.getByRole("button", { name: "Start a new attempt" }).click();
    await page.getByRole("radio", { name: "3", exact: true }).check();
    await page.getByRole("button", { name: "Submit answer" }).click();
    await expect(page.getByTestId("mastery-after")).toHaveText(
      i ? "16%" : "27%",
    );
  }
  await page.locator('a[href="/advisor"]:visible').first().click();
  await page.getByRole("link", { name: "Early warning", exact: true }).click();
  await page
    .locator("main:visible")
    .getByLabel("Student", { exact: true })
    .selectOption("S-NOUR");
  await expect(
    page.getByRole("heading", { name: "Repeated prerequisite difficulty" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent progress declined" }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(evidence, "ad5-recorded-trends.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("link", { name: /Control Center Presenter/ }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Reset demo", exact: true })
    .click();
  await page.locator('a[href="/advisor"]:visible').first().click();
  await page.getByRole("link", { name: "Nour", exact: true }).click();
  await expect(page.locator("#concept-PY-REC:visible")).toContainText("35%");
  await expect(page.locator("#concept-MA-DERIV:visible")).toContainText("45%");
});
test("keyboard navigation, mobile drawer and Arabic dialog focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/advisor/ad1");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main:visible")).toBeFocused();
  await page.getByRole("button", { name: "العربية", exact: true }).click();
  await page.getByRole("button", { name: "فتح التنقل" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveAttribute("dir", "rtl");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "فتح التنقل" })).toBeFocused();
  await page.getByRole("link", { name: "رسائل الدعم", exact: true }).click();
  await page
    .getByRole("button", { name: "معاينة الرسالة", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إرسال الرسالة (محاكاة)", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("button", { name: "إلغاء", exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: path.join(evidence, "ad4-ar-confirm-mobile.png"),
    fullPage: false,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
});
test("nudge validation, template replacement, recipient and preview invalidation", async ({
  page,
}) => {
  await page.goto("/advisor/ad4");
  await page.getByLabel("Message", { exact: true }).fill("   ");
  await expect(
    page.getByRole("button", { name: "Preview nudge", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Message", { exact: true }).fill("Edited draft");
  await page.getByLabel("Template", { exact: true }).selectOption("2");
  await page
    .getByRole("button", { name: "Replace draft", exact: true })
    .click();
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue(
    /thank you for the effort/,
  );
  await page.getByLabel("Recipient", { exact: true }).selectOption("S-SALMA");
  await expect(page).toHaveURL(/student=S-SALMA/);
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue(
    /Hi Salma/,
  );
  await page.getByLabel("Course context").selectOption("C-MATH");
  await page
    .getByRole("button", { name: "Preview nudge", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send nudge (simulated)", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Message", { exact: true }).fill("Updated text");
  await expect(
    page.getByRole("button", { name: "Send nudge (simulated)", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Preview nudge", exact: true })
    .click();
  await expect(page.locator("blockquote:visible")).toHaveText("Updated text");
  await expect(page.getByLabel("Message", { exact: true })).toHaveAttribute(
    "maxlength",
    "1000",
  );
});
