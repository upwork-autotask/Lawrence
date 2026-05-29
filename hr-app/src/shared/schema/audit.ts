import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { pk } from './common';
import { sql } from 'drizzle-orm';

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: pk(),
    userId: integer('user_id'),
    action: text('action', { enum: ['insert', 'update', 'delete', 'login', 'logout', 'fail'] }).notNull(),
    entity: text('entity').notNull(),
    entityId: integer('entity_id'),
    beforeJson: text('before_json'),
    afterJson: text('after_json'),
    ipAddress: text('ip_address'),
    at: integer('at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    entityIdx: index('audit_log_entity_idx').on(t.entity, t.entityId),
    userIdx: index('audit_log_user_idx').on(t.userId),
    atIdx: index('audit_log_at_idx').on(t.at),
  }),
);

export const notifications = sqliteTable(
  'notifications',
  {
    id: pk(),
    userId: integer('user_id').notNull(),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'),
    payloadJson: text('payload_json'),
    readAt: integer('read_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    userIdx: index('notifications_user_idx').on(t.userId),
    unreadIdx: index('notifications_unread_idx').on(t.userId, t.readAt),
  }),
);

export const emailOutbox = sqliteTable(
  'email_outbox',
  {
    id: pk(),
    toAddr: text('to_addr').notNull(),
    ccAddr: text('cc_addr'),
    subject: text('subject').notNull(),
    bodyHtml: text('body_html').notNull(),
    bodyText: text('body_text'),
    status: text('status', { enum: ['pending', 'sent', 'failed'] }).notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
  },
  (t) => ({
    statusIdx: index('email_outbox_status_idx').on(t.status),
  }),
);
