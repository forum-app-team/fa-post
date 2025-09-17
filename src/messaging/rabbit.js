import amqp from 'amqplib';

let connection = null;
let channel = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/';
const EXCHANGE = process.env.RABBITMQ_EVENTS_EXCHANGE || 'fa.events';
const EXCHANGE_TYPE = process.env.RABBITMQ_EVENTS_EXCHANGE_TYPE || 'topic';

export async function initRabbit() {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    connection.on('error', (e) => console.error('[rabbit] connection error', e.message));
    connection.on('close', () => console.warn('[rabbit] connection closed'));

    channel = await connection.createConfirmChannel();
    await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
    console.log(`[rabbit] connected. exchange=${EXCHANGE} type=${EXCHANGE_TYPE}`);
  } catch (err) {
    console.warn('[rabbit] init failed (continuing without MQ):', err?.message);
    connection = null;
    channel = null;
  }
}

export function isRabbitReady() {
  return !!channel;
}

export async function publishEvent(routingKey, payload, opts = {}) {
  if (!channel) return false;
  try {
    const props = {
      contentType: 'application/json',
      deliveryMode: 2, // persistent
      correlationId: opts.correlationId,
      messageId: payload?.eventId,
      timestamp: Math.floor(Date.now() / 1000),
      headers: opts.headers || {},
    };
    await new Promise((resolve, reject) => {
      const ok = channel.publish(
        EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        props,
        (err) => (err ? reject(err) : resolve(true))
      );
      if (!ok) {
        // backpressure – still wait for confirm callback
      }
    });
    return true;
  } catch (err) {
    console.error('[rabbit] publish error:', err?.message);
    return false;
  }
}

export async function closeRabbit() {
  try {
    if (channel) await channel.close();
  } catch {}
  try {
    if (connection) await connection.close();
  } catch {}
  channel = null;
  connection = null;
}

