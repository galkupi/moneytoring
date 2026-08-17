/*
 * MoneyToring — MAX login test (Step 1).
 * Validates that we can log into MAX automatically and fetch transactions.
 * IMPORTANT: prints ONLY counts/dates — never amounts, merchants, or credentials —
 * because GitHub Actions logs on a public repo are publicly visible.
 */
const { createScraper, CompanyTypes } = require("israeli-bank-scrapers");

(async () => {
  const username = process.env.MAX_USER;
  const password = process.env.MAX_PASS;
  if (!username || !password) {
    console.error("Missing MAX_USER / MAX_PASS secrets. Add them in the repo Settings → Secrets.");
    process.exit(1);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // last 30 days

  const scraper = createScraper({
    companyId: CompanyTypes.max,
    startDate,
    combineInstallments: false,
    showBrowser: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const result = await scraper.scrape({ username, password });

    if (!result.success) {
      console.error("LOGIN FAILED ✗");
      console.error("  reason:", result.errorType || "unknown");
      if (result.errorMessage) console.error("  detail:", result.errorMessage);
      console.error("  (if this mentions OTP / one-time code, automation is blocked by MAX)");
      process.exit(2);
    }

    let txns = 0;
    let latest = null;
    for (const acc of result.accounts || []) {
      for (const tx of acc.txns || []) {
        txns++;
        const d = new Date(tx.date);
        if (!latest || d > latest) latest = d;
      }
    }

    console.log("LOGIN OK ✓");
    console.log("accounts found:", (result.accounts || []).length);
    console.log("transactions (last 30 days):", txns);
    console.log("most recent transaction date:", latest ? latest.toISOString().slice(0, 10) : "none");
    console.log("→ Automation is possible. We can proceed to the daily job + app integration.");
  } catch (e) {
    console.error("ERROR:", e && e.message ? e.message : String(e));
    process.exit(3);
  }
})();
