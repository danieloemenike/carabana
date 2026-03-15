const STAFF_ONLY_MESSAGE = "Access is restricted to Carabana staff accounts.";

function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function getStaffOnlyMessage(): string {
  return STAFF_ONLY_MESSAGE;
}

export function isStaffEmailAllowed(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const exactAllowlist = parseCsv(process.env.STAFF_EMAIL_ALLOWLIST);
  const domainAllowlist = parseCsv(process.env.STAFF_EMAIL_DOMAIN_ALLOWLIST);

  // Default-open mode: when no allowlist is configured, accept any email.
  // Setting either env var switches to restricted mode.
  if (exactAllowlist.length === 0 && domainAllowlist.length === 0) {
    return true;
  }

  if (exactAllowlist.includes(normalizedEmail)) {
    return true;
  }

  const domain = normalizedEmail.split("@")[1];
  if (domain && domainAllowlist.includes(domain)) {
    return true;
  }

  return false;
}
