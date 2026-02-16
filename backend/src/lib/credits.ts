import { eq } from "drizzle-orm";
import type { Database } from "../db";
import * as schema from "../db/schema";

export type CreditWorkflow = "image-from-text" | "image-from-reference" | "video-from-reference";

export type CreditBalance = {
  productShoots: number;
  adGraphics: number;
};

type CreditRow = {
  creditsProductShoots: number;
  creditsAdGraphics: number;
};

type AccountType = "free" | "paid";

const RESERVE_REASON = "generation_debit";
const REFUND_REASON = "generation_refund";

const SELECT_BALANCE_SQL = `
SELECT
  credits_product_shoots AS creditsProductShoots,
  credits_ad_graphics AS creditsAdGraphics
FROM user_profile
WHERE user_id = ?1
`;

const RESERVE_PRODUCT_SHOOTS_SQL = `
UPDATE user_profile
SET
  credits_product_shoots = credits_product_shoots - 1,
  updated_at = unixepoch()
WHERE user_id = ?1
  AND credits_product_shoots > 0
RETURNING
  credits_product_shoots AS creditsProductShoots,
  credits_ad_graphics AS creditsAdGraphics
`;

const RESERVE_AD_GRAPHICS_SQL = `
UPDATE user_profile
SET
  credits_ad_graphics = credits_ad_graphics - 1,
  updated_at = unixepoch()
WHERE user_id = ?1
  AND credits_ad_graphics > 0
RETURNING
  credits_product_shoots AS creditsProductShoots,
  credits_ad_graphics AS creditsAdGraphics
`;

const REFUND_PRODUCT_SHOOTS_SQL = `
UPDATE user_profile
SET
  credits_product_shoots = credits_product_shoots + 1,
  updated_at = unixepoch()
WHERE user_id = ?1
RETURNING
  credits_product_shoots AS creditsProductShoots,
  credits_ad_graphics AS creditsAdGraphics
`;

const REFUND_AD_GRAPHICS_SQL = `
UPDATE user_profile
SET
  credits_ad_graphics = credits_ad_graphics + 1,
  updated_at = unixepoch()
WHERE user_id = ?1
RETURNING
  credits_product_shoots AS creditsProductShoots,
  credits_ad_graphics AS creditsAdGraphics
`;

function getDefaultCredits(accountType: AccountType): CreditBalance {
  if (accountType === "paid") {
    return { productShoots: 10, adGraphics: 10 };
  }
  return { productShoots: 1, adGraphics: 1 };
}

function toCreditBalance(row: CreditRow): CreditBalance {
  return {
    productShoots: row.creditsProductShoots,
    adGraphics: row.creditsAdGraphics,
  };
}

function resolveSql(workflow: CreditWorkflow, mode: "reserve" | "refund"): string {
  const isProductShoots = workflow === "image-from-text";
  if (mode === "reserve") {
    return isProductShoots ? RESERVE_PRODUCT_SHOOTS_SQL : RESERVE_AD_GRAPHICS_SQL;
  }
  return isProductShoots ? REFUND_PRODUCT_SHOOTS_SQL : REFUND_AD_GRAPHICS_SQL;
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
        creditsProductShoots: defaults.productShoots,
        creditsAdGraphics: defaults.adGraphics,
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
