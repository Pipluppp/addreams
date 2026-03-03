import { eq } from "drizzle-orm";
import type { Database } from "../db";
import * as schema from "../db/schema";

export type CreditWorkflow = "image-from-text" | "image-from-reference" | "video-from-reference";

export type CreditBalance = {
  imageEdits: number;
};

type CreditRow = {
  creditsImageEdits: number;
};

type AccountType = "free" | "paid";

const RESERVE_REASON = "generation_debit";
const REFUND_REASON = "generation_refund";

const SELECT_BALANCE_SQL = `
SELECT
  credits_image_edits AS creditsImageEdits
FROM user_profile
WHERE user_id = ?1
`;

const RESERVE_IMAGE_EDITS_SQL = `
UPDATE user_profile
SET
  credits_image_edits = credits_image_edits - 1,
  updated_at = unixepoch()
WHERE user_id = ?1
  AND credits_image_edits > 0
RETURNING
  credits_image_edits AS creditsImageEdits
`;

const REFUND_IMAGE_EDITS_SQL = `
UPDATE user_profile
SET
  credits_image_edits = credits_image_edits + 1,
  updated_at = unixepoch()
WHERE user_id = ?1
RETURNING
  credits_image_edits AS creditsImageEdits
`;

function getDefaultCredits(accountType: AccountType): CreditBalance {
  if (accountType === "paid") {
    return { imageEdits: 20 };
  }
  return { imageEdits: 2 };
}

function toCreditBalance(row: CreditRow): CreditBalance {
  return {
    imageEdits: row.creditsImageEdits,
  };
}

function resolveSql(_workflow: CreditWorkflow, mode: "reserve" | "refund"): string {
  return mode === "reserve" ? RESERVE_IMAGE_EDITS_SQL : REFUND_IMAGE_EDITS_SQL;
}

async function readBalance(db: D1Database, userId: string): Promise<CreditBalance> {
  const row = await db.prepare(SELECT_BALANCE_SQL).bind(userId).first<CreditRow>();
  if (!row) {
    return getDefaultCredits("free");
  }
  return toCreditBalance(row);
}

export async function ensureUserProfile(db: Database, userId: string) {
  const existing = await db.query.userProfile.findFirst({
    where: eq(schema.userProfile.userId, userId),
  });

  if (existing) {
    return existing;
  }

  const defaults = getDefaultCredits("free");

  try {
    const [created] = await db
      .insert(schema.userProfile)
      .values({
        userId,
        accountType: "free",
        creditsImageEdits: defaults.imageEdits,
      })
      .returning();

    if (created) {
      return created;
    }
  } catch {
    // Unique races can happen when two requests create a profile simultaneously.
  }

  const fallback = await db.query.userProfile.findFirst({
    where: eq(schema.userProfile.userId, userId),
  });

  if (!fallback) {
    throw new Error("Failed to create or load user_profile.");
  }

  return fallback;
}

export async function reserveCredit(args: {
  db: Database;
  d1: D1Database;
  userId: string;
  workflow: CreditWorkflow;
}) {
  await ensureUserProfile(args.db, args.userId);

  const row = await args.d1
    .prepare(resolveSql(args.workflow, "reserve"))
    .bind(args.userId)
    .first<CreditRow>();

  if (!row) {
    return {
      success: false as const,
      balance: await readBalance(args.d1, args.userId),
    };
  }

  await args.db.insert(schema.creditLedger).values({
    id: crypto.randomUUID(),
    userId: args.userId,
    workflow: args.workflow,
    delta: -1,
    reason: RESERVE_REASON,
  });

  return {
    success: true as const,
    balance: toCreditBalance(row),
  };
}

export async function refundCredit(args: {
  db: Database;
  d1: D1Database;
  userId: string;
  workflow: CreditWorkflow;
}) {
  await ensureUserProfile(args.db, args.userId);

  const row = await args.d1
    .prepare(resolveSql(args.workflow, "refund"))
    .bind(args.userId)
    .first<CreditRow>();

  const balance = row ? toCreditBalance(row) : await readBalance(args.d1, args.userId);

  await args.db.insert(schema.creditLedger).values({
    id: crypto.randomUUID(),
    userId: args.userId,
    workflow: args.workflow,
    delta: 1,
    reason: REFUND_REASON,
  });

  return balance;
}
