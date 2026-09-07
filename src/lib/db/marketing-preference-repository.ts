import { and, desc, eq, sql } from "drizzle-orm";
import type { MarketingPreferenceRepository } from "../privacy/preferences";
import { getDatabase, type Database } from "./index";
import {
  customerMarketingPreferences,
  customers,
  orderConsents,
  orders,
  stores,
} from "./schema";

export class DrizzleMarketingPreferenceRepository implements MarketingPreferenceRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async getPreference(storeId: string, customerId: string) {
    const [base] = await this.database
      .select({
        storeId: stores.id,
        storeName: stores.name,
        customerId: customers.id,
        customerName: customers.name,
        email: customers.email,
        phone: customers.phone,
      })
      .from(customers)
      .innerJoin(stores, eq(stores.id, customers.storeId))
      .where(and(eq(customers.storeId, storeId), eq(customers.id, customerId)))
      .limit(1);
    if (!base) return null;

    const [override] = await this.database
      .select({
        emailMarketingAllowed: customerMarketingPreferences.emailMarketingAllowed,
        smsMarketingAllowed: customerMarketingPreferences.smsMarketingAllowed,
        whatsappMarketingAllowed: customerMarketingPreferences.whatsappMarketingAllowed,
        privacyPolicyVersion: customerMarketingPreferences.privacyPolicyVersion,
        updatedAt: customerMarketingPreferences.updatedAt,
      })
      .from(customerMarketingPreferences)
      .where(
        and(
          eq(customerMarketingPreferences.storeId, storeId),
          eq(customerMarketingPreferences.customerId, customerId),
        ),
      )
      .limit(1);

    if (override) return { ...base, ...override };

    const [latest] = await this.database
      .select({
        emailMarketingAllowed: orderConsents.emailMarketingAllowed,
        smsMarketingAllowed: orderConsents.smsMarketingAllowed,
        whatsappMarketingAllowed: orderConsents.whatsappMarketingAllowed,
        privacyPolicyVersion: orderConsents.privacyPolicyVersion,
        updatedAt: orderConsents.capturedAt,
      })
      .from(orders)
      .innerJoin(
        orderConsents,
        and(
          eq(orderConsents.orderId, orders.id),
          eq(orderConsents.storeId, storeId),
        ),
      )
      .where(and(eq(orders.storeId, storeId), eq(orders.customerId, customerId)))
      .orderBy(desc(orderConsents.capturedAt), desc(orders.createdAt))
      .limit(1);

    return {
      ...base,
      emailMarketingAllowed: latest?.emailMarketingAllowed ?? false,
      smsMarketingAllowed: latest?.smsMarketingAllowed ?? false,
      whatsappMarketingAllowed: latest?.whatsappMarketingAllowed ?? false,
      privacyPolicyVersion: latest?.privacyPolicyVersion ?? "unknown",
      updatedAt: latest?.updatedAt ?? new Date(0),
    };
  }

  async updatePreference(input: {
    storeId: string;
    customerId: string;
    emailMarketingAllowed: boolean;
    smsMarketingAllowed: boolean;
    whatsappMarketingAllowed: boolean;
    privacyPolicyVersion: string;
    now: Date;
  }) {
    const existing = await this.database
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.storeId, input.storeId), eq(customers.id, input.customerId)))
      .limit(1);
    if (!existing[0]) return null;

    await this.database
      .insert(customerMarketingPreferences)
      .values({
        storeId: input.storeId,
        customerId: input.customerId,
        emailMarketingAllowed: input.emailMarketingAllowed,
        smsMarketingAllowed: input.smsMarketingAllowed,
        whatsappMarketingAllowed: input.whatsappMarketingAllowed,
        privacyPolicyVersion: input.privacyPolicyVersion,
        source: "SELF_SERVICE",
        createdAt: input.now,
        updatedAt: input.now,
      })
      .onConflictDoUpdate({
        target: [customerMarketingPreferences.storeId, customerMarketingPreferences.customerId],
        set: {
          emailMarketingAllowed: input.emailMarketingAllowed,
          smsMarketingAllowed: input.smsMarketingAllowed,
          whatsappMarketingAllowed: input.whatsappMarketingAllowed,
          privacyPolicyVersion: input.privacyPolicyVersion,
          source: "SELF_SERVICE",
          updatedAt: input.now,
        },
      });

    return this.getPreference(input.storeId, input.customerId);
  }
}
