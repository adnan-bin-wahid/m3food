import { z } from "zod";
import type { AdminIdentity } from "../auth/admin-repository";
import type {
  AdminCustomerQuery,
  AdminCustomerRepository,
  CustomerSegment,
  MarketingChannel,
} from "./customer-admin-repository";

export const ADMIN_CUSTOMER_PAGE_SIZE = 20;
export const HIGH_VALUE_CUSTOMER_THRESHOLD_MINOR = 500_000;
const CUSTOMER_SEGMENTS = ["ALL", "NEW", "REPEAT", "HIGH_VALUE"] as const;
const MARKETING_CHANNELS = ["ALL", "EMAIL", "SMS", "WHATSAPP"] as const;

export const customerIdSchema = z.string().uuid();
export const customerTagSchema = z.string().trim().min(1).max(40).transform((value) =>
  value.replace(/\s+/g, " ").toLocaleLowerCase("en-US"),
);
export const customerNoteSchema = z.string().trim().min(1).max(1000);
export const audienceChannelSchema = z.enum(["EMAIL", "SMS", "WHATSAPP"]);

export class AdminCustomerError extends Error {
  constructor(
    public readonly code: "FORBIDDEN" | "NOT_FOUND" | "DUPLICATE",
    message: string,
  ) {
    super(message);
    this.name = "AdminCustomerError";
  }
}

function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function enumQueryValue<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]) {
  const candidate = firstQueryValue(value);
  return typeof candidate === "string" && allowed.includes(candidate as T[number])
    ? (candidate as T[number])
    : fallback;
}

export function parseAdminCustomerQuery(query: Record<string, unknown> = {}): AdminCustomerQuery {
  const rawQuery = firstQueryValue(query.q);
  const search = typeof rawQuery === "string" ? rawQuery.trim().slice(0, 80) : "";
  const segment = enumQueryValue(query.segment, CUSTOMER_SEGMENTS, "ALL") as CustomerSegment;
  const channel = enumQueryValue(query.channel, MARKETING_CHANNELS, "ALL") as MarketingChannel;
  const rawPage = firstQueryValue(query.page);
  const parsedPage = typeof rawPage === "string" ? Number.parseInt(rawPage, 10) : 1;
  const page = Number.isSafeInteger(parsedPage) ? Math.min(10_000, Math.max(1, parsedPage)) : 1;
  return { query: search, segment, channel, page, pageSize: ADMIN_CUSTOMER_PAGE_SIZE };
}

export function canManageCustomerOperations(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN" || role === "ORDER_MANAGER";
}

export function canExportCustomerAudience(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN";
}

export async function listAdminCustomers(
  identity: AdminIdentity,
  query: AdminCustomerQuery,
  repository: AdminCustomerRepository,
) {
  const result = await repository.listCustomers(identity.storeId, query);
  if (!result) throw new AdminCustomerError("NOT_FOUND", "The store was not found.");
  const total = Math.max(0, Number(result.total) || 0);
  return {
    ...result,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    query,
    canManage: canManageCustomerOperations(identity.role),
    canExport: canExportCustomerAudience(identity.role),
  };
}

export async function getAdminCustomer(
  identity: AdminIdentity,
  customerId: unknown,
  repository: AdminCustomerRepository,
) {
  const id = customerIdSchema.parse(customerId);
  const customer = await repository.getCustomer(identity.storeId, id);
  if (!customer) return null;
  return {
    ...customer,
    canManage: canManageCustomerOperations(identity.role),
    canExport: canExportCustomerAudience(identity.role),
  };
}

function requireCustomerWrite(identity: AdminIdentity) {
  if (!canManageCustomerOperations(identity.role)) {
    throw new AdminCustomerError("FORBIDDEN", "This account has read-only customer access.");
  }
}

export async function addAdminCustomerTag(
  identity: AdminIdentity,
  input: { customerId: unknown; tag: unknown },
  repository: AdminCustomerRepository,
  now = new Date(),
) {
  requireCustomerWrite(identity);
  const customerId = customerIdSchema.parse(input.customerId);
  const tag = customerTagSchema.parse(input.tag);
  const result = await repository.addTag({
    storeId: identity.storeId,
    customerId,
    tag,
    actor: { id: identity.id, email: identity.email },
    now,
  });
  if (result.kind === "NOT_FOUND") throw new AdminCustomerError("NOT_FOUND", "Customer not found.");
  if (result.kind === "DUPLICATE") throw new AdminCustomerError("DUPLICATE", "That tag is already attached.");
  return result;
}

export async function removeAdminCustomerTag(
  identity: AdminIdentity,
  input: { customerId: unknown; tag: unknown },
  repository: AdminCustomerRepository,
  now = new Date(),
) {
  requireCustomerWrite(identity);
  const customerId = customerIdSchema.parse(input.customerId);
  const tag = customerTagSchema.parse(input.tag);
  const result = await repository.removeTag({
    storeId: identity.storeId,
    customerId,
    tag,
    actor: { id: identity.id, email: identity.email },
    now,
  });
  if (result.kind === "NOT_FOUND") throw new AdminCustomerError("NOT_FOUND", "Customer tag not found.");
  return result;
}

export async function addAdminCustomerNote(
  identity: AdminIdentity,
  input: { customerId: unknown; note: unknown },
  repository: AdminCustomerRepository,
  now = new Date(),
) {
  requireCustomerWrite(identity);
  const customerId = customerIdSchema.parse(input.customerId);
  const note = customerNoteSchema.parse(input.note);
  const result = await repository.addNote({
    storeId: identity.storeId,
    customerId,
    note,
    actor: { id: identity.id, email: identity.email },
    now,
  });
  if (result.kind === "NOT_FOUND") throw new AdminCustomerError("NOT_FOUND", "Customer not found.");
  return result;
}

export async function getAdminMarketingAudience(
  identity: AdminIdentity,
  channel: unknown,
  repository: AdminCustomerRepository,
) {
  if (!canExportCustomerAudience(identity.role)) {
    throw new AdminCustomerError("FORBIDDEN", "Only Owner and Admin accounts can export marketing audiences.");
  }
  const parsedChannel = audienceChannelSchema.parse(channel);
  return repository.listMarketingAudience(identity.storeId, parsedChannel);
}
