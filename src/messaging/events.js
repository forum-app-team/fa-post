import { v4 as uuidv4 } from 'uuid';
import { publishEvent } from './rabbit.js';

function pickPostSnapshot(post) {
  return {
    status: post.status,
    isArchived: !!post.isArchived,
    title: post.title,
    content: post.content,
    images: post.images || [],
    attachments: post.attachments || [],
  };
}

export function buildPostEvent(req, eventType, post, before = null, after = null) {
  const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || uuidv4();
  const traceId = req.headers['x-request-id'] || correlationId;
  const eventId = uuidv4();
  return {
    eventId,
    eventType,
    occurredAt: new Date().toISOString(),
    userId: req.user?.sub,
    postId: String(post.id),
    before,
    after,
    correlationId,
    traceId,
    service: 'fa-post',
    version: 1,
  };
}

export async function emitPostEvent(req, eventType, post, before = null, after = null) {
  const payload = buildPostEvent(
    req,
    eventType,
    post,
    before === 'SNAPSHOT' ? pickPostSnapshot(post) : before,
    after === 'SNAPSHOT' ? pickPostSnapshot(post) : after
  );
  try {
    await publishEvent(eventType, payload, { correlationId: payload.correlationId });
  } catch (e) {
    // Swallow to avoid impacting API response path
  }
}

