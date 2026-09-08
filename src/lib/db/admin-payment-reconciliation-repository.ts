import { sql } from "drizzle-orm";
import type {
  AdminPaymentReconciliationRepository,
  PaymentReconciliationCandidate,
} from "../admin/payment-reconciliation-repository";
import { getDatabase, type Database } from "./index";

function nonnegativeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isSafeInteger(parsed) && parsed >= 0
    ? parsed
    : 0;
}

function nullableNonnegativeNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  return nonnegativeNumber(value);
}

function dateValue(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export class DrizzleAdminPaymentReconciliationRepository
  implements AdminPaymentReconciliationRepository
{
  constructor(
    private readonly database: Database = getDatabase(),
  ) {}

  async listCandidates(storeId: string) {
    const rows = (await this.database.execute(sql<{
      publicId: string;
      customerName: string;
      customerPhone: string;
      orderStatus: PaymentReconciliationCandidate["orderStatus"];
      orderPaymentMethod: PaymentReconciliationCandidate["orderPaymentMethod"];
      orderPaymentStatus: PaymentReconciliationCandidate["orderPaymentStatus"];
      orderTotalMinor: number | string;
      currency: string;
      timezone: string;
      orderCreatedAt: Date | string;
      orderUpdatedAt: Date | string;
      paymentId: string | null;
      paymentMethod: PaymentReconciliationCandidate["paymentMethod"];
      paymentStatus: PaymentReconciliationCandidate["paymentStatus"];
      paymentAmountMinor: number | string | null;
      providerReference: string | null;
      paymentRevision: number | string | null;
      paymentUpdatedAt: Date | string | null;
      attentionSince: Date | string;
    }>`
      select
        o.public_id as "publicId",
        o.customer_name as "customerName",
        o.customer_phone as "customerPhone",
        o.status as "orderStatus",
        o.payment_method as "orderPaymentMethod",
        o.payment_status as "orderPaymentStatus",
        o.total_minor as "orderTotalMinor",
        o.currency,
        s.timezone,
        o.created_at as "orderCreatedAt",
        o.updated_at as "orderUpdatedAt",
        p.id as "paymentId",
        p.method as "paymentMethod",
        p.status as "paymentStatus",
        p.amount_minor as "paymentAmountMinor",
        p.provider_reference as "providerReference",
        p.revision as "paymentRevision",
        p.updated_at as "paymentUpdatedAt",
        greatest(
          o.updated_at,
          coalesce(p.updated_at, o.updated_at)
        ) as "attentionSince"
      from orders o
      inner join stores s
        on s.id = o.store_id
      left join lateral (
        select
          latest.id,
          latest.method,
          latest.status,
          latest.amount_minor,
          latest.provider_reference,
          latest.revision,
          latest.updated_at
        from payments latest
        where latest.store_id = o.store_id
          and latest.order_id = o.id
        order by
          latest.created_at desc,
          latest.id desc
        limit 1
      ) p on true
      where o.store_id = ${storeId}
        and (
          p.id is null
          or o.payment_status is distinct from p.status
          or (
            o.status = 'DELIVERED'
            and p.status in ('UNPAID', 'PENDING', 'FAILED')
          )
          or (
            o.status in ('CANCELLED', 'RETURNED')
            and p.status in ('PAID', 'PENDING')
          )
        )
      order by
        greatest(
          o.updated_at,
          coalesce(p.updated_at, o.updated_at)
        ) asc,
        o.created_at asc,
        o.id asc
    `)) as unknown as Array<{
      publicId: string;
      customerName: string;
      customerPhone: string;
      orderStatus: PaymentReconciliationCandidate["orderStatus"];
      orderPaymentMethod: PaymentReconciliationCandidate["orderPaymentMethod"];
      orderPaymentStatus: PaymentReconciliationCandidate["orderPaymentStatus"];
      orderTotalMinor: number | string;
      currency: string;
      timezone: string;
      orderCreatedAt: Date | string;
      orderUpdatedAt: Date | string;
      paymentId: string | null;
      paymentMethod: PaymentReconciliationCandidate["paymentMethod"];
      paymentStatus: PaymentReconciliationCandidate["paymentStatus"];
      paymentAmountMinor: number | string | null;
      providerReference: string | null;
      paymentRevision: number | string | null;
      paymentUpdatedAt: Date | string | null;
      attentionSince: Date | string;
    }>;

    return rows.map(
      (row): PaymentReconciliationCandidate => ({
        publicId: row.publicId,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        orderStatus: row.orderStatus,
        orderPaymentMethod: row.orderPaymentMethod,
        orderPaymentStatus: row.orderPaymentStatus,
        orderTotalMinor: nonnegativeNumber(
          row.orderTotalMinor,
        ),
        currency: row.currency,
        timezone: row.timezone,
        orderCreatedAt: dateValue(row.orderCreatedAt),
        orderUpdatedAt: dateValue(row.orderUpdatedAt),
        paymentId: row.paymentId,
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
        paymentAmountMinor: nullableNonnegativeNumber(
          row.paymentAmountMinor,
        ),
        providerReference: row.providerReference,
        paymentRevision: nullableNonnegativeNumber(
          row.paymentRevision,
        ),
        paymentUpdatedAt:
          row.paymentUpdatedAt === null
            ? null
            : dateValue(row.paymentUpdatedAt),
        attentionSince: dateValue(row.attentionSince),
      }),
    );
  }
}
