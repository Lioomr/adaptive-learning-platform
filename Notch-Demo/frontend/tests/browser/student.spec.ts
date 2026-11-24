import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => console.log("BROWSER ERROR:", error.message));
});

async function onboard(page: Page) {
  await page.goto("/student");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await dialog.getByRole("radio").first().check();
    await dialog
      .getByRole("button", {
        name: i === 2 ? "Create my learning space" : "Continue",
        exact: true,
      })
      .click();
  }
  await expect(dialog).toHaveCount(0);
}

test("first-time diagnostic, persistence, four-tab sidebar, and role isolation", async ({
  page,
}) => {
  await page.goto("/student");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await onboard(page);
  const sidebar = page.locator("aside").first();
  for (const label of ["Home", "Dashboard", "Courses", "Chatbot"])
    await expect(
      sidebar.getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
  await expect(
    sidebar.getByRole("link", { name: /Instructor|Advisor/ }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A little progress, every day." }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("A visual explanation", { exact: true }),
  ).toBeVisible();
  await page.goto("/advisor");
  await expect(
    page
      .locator("aside")
      .first()
      .getByRole("link", { name: /Instructor/ }),
  ).toBeVisible();
});

test("all five courses and seven sections render with working More navigation", async ({
  page,
}) => {
  await onboard(page);
  await page.getByRole("link", { name: "Courses", exact: true }).click();
  for (const id of ["mathematics", "english", "python", "algorithms", "ai"]) {
    await page.goto(`/student/courses/${id}/progress`);
    await expect(
      page.getByRole("heading", { name: "Your knowledge, taking shape" }),
    ).toBeVisible();
    for (const section of [
      "announcements",
      "lectures",
      "labs",
      "submissions",
      "grades",
      "materials",
    ]) {
      const labels: Record<string, string> = {
        announcements: "Announcements",
        lectures: "Lectures",
        labs: "Labs",
        submissions: "Submissions",
        grades: "Grades",
        materials: "Extra Materials",
      };
      if (["submissions", "grades", "materials"].includes(section)) {
        await page
          .getByRole("navigation", { name: "Course navigation" })
          .getByRole("button")
          .click();
        await page
          .getByRole("menuitem", { name: labels[section], exact: true })
          .click();
      } else
        await page
          .getByRole("navigation", { name: "Course navigation" })
          .getByRole("link", { name: labels[section], exact: true })
          .click();
      await expect(page).toHaveURL(new RegExp(`/${id}/${section}$`));
      await expect(page.locator("main")).not.toContainText("Application error");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  }
});

test("lesson completion updates Progress, Courses, and survives refresh", async ({
  page,
}) => {
  await onboard(page);
  await page.goto("/student/courses/python/lectures");
  await page
    .getByRole("button", { name: "Continue learning", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Functions and the call stack",
  );
  await page.getByRole("button", { name: "Mark as complete" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Completed", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close lesson" }).click();
  await page.getByRole("link", { name: "Progress", exact: true }).click();
  await expect(
    page.getByText("2 of 4 learning activities completed."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("2 of 4 learning activities completed."),
  ).toBeVisible();
  await page.goto("/student/courses");
  await expect(
    page.getByRole("link").filter({
      has: page.getByRole("heading", {
        name: "Python Programming",
        exact: true,
      }),
    }),
  ).toContainText("50%");
});

test("drafts restore and submissions update academic pending count", async ({
  page,
}) => {
  await onboard(page);
  await page.goto("/student/courses/python/submissions");
  await expect(
    page.getByRole("button", { name: "Submit demo response" }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Your response" })
    .fill(
      "I defined double(n), returned n * 2, and traced double(double(3)) to 12.",
    );
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Your response" }),
  ).toHaveValue(/traced/);
  await page.getByRole("button", { name: "Submit demo response" }).click();
  await expect(
    page.getByText("Your demo submission is saved and awaiting review."),
  ).toBeVisible();
  await page.goto("/student/dashboard");
  await expect(
    page
      .locator('[data-slot="card"]')
      .filter({ hasText: "Pending submissions" })
      .first(),
  ).toContainText("3");
  await expect(
    page.getByRole("link").filter({ hasText: "Functions in practice" }),
  ).toContainText("Submitted");
});

test("tutor supports empty state, course-specific responses, history, and keyboard sending", async ({
  page,
}) => {
  await onboard(page);
  await page.goto("/student/chatbot?course=python");
  await expect(page.getByRole("log")).toContainText(
    "What should I focus on next?",
  );
  await page.getByRole("button", { name: "New conversation" }).click();
  await expect(
    page.getByRole("heading", { name: "Every good question is a beginning." }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Message your learning assistant" })
    .fill("Explain functions");
  await page
    .getByRole("textbox", { name: "Message your learning assistant" })
    .press("Enter");
  await expect(page.getByRole("log")).toContainText(
    "Every call adds a frame to the call stack.",
  );
  await page.reload();
  await expect(page.getByRole("log")).toContainText("Explain functions");
  await page.getByLabel("Choose a course").selectOption("ai");
  await page
    .getByRole("button", { name: "Give me a practice exercise", exact: true })
    .click();
  await expect(page.getByRole("log")).toContainText("spam classifier");
});

test("calendar month/day selection, searchable courses, and download", async ({
  page,
}) => {
  await onboard(page);
  await page.goto("/student/dashboard");
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(
    page.getByRole("heading", { name: "December 2026" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "2 December, has events", exact: true })
    .click();
  await expect(
    page.getByText("Academic writing assessment", { exact: true }),
  ).toBeVisible();
  await page.goto("/student/courses");
  await page.getByRole("textbox", { name: "Search courses" }).fill("zzzz");
  await expect(
    page.getByRole("heading", { name: "No matching courses" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(5);
  await page.goto("/student/courses/python/materials");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download study guide (.txt)", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "notch-python-en-study-guide.txt",
  );
});

test("Arabic, dark mode, mobile drawer, and layouts have no horizontal overflow", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await onboard(page);
  await page.screenshot({
    path: testInfo.outputPath("home-desktop-light.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "تقدّم صغير، كل يوم." }),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "المظهر" }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute(
    "data-notch-theme",
    "dark",
  );
  await page.screenshot({
    path: testInfo.outputPath("home-desktop-arabic-dark.png"),
    fullPage: true,
  });
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of [
      "/student",
      "/student/dashboard",
      "/student/courses",
      "/student/courses/python/grades",
      "/student/chatbot",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBeTruthy();
    }
  }
  await page.getByRole("button", { name: "فتح القائمة" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "المقررات", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/student\/courses$/);
  await page.screenshot({
    path: testInfo.outputPath("courses-mobile-arabic-dark.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to English" }).click();
  await page
    .getByRole("combobox", { name: "Appearance" })
    .selectOption("light");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/student");
  await page.screenshot({
    path: testInfo.outputPath("home-mobile-light.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("invalid course and section return not found", async ({ page }) => {
  await onboard(page);
  await page.goto("/student/courses/unknown/progress");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await page.goto("/student/courses/python/unknown");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});
