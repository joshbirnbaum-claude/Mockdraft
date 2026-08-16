import { io, type Socket } from 'socket.io-client';

// Explicit VITE_SERVER_URL always wins. Otherwise: in dev the client and
// server run on separate Vite/Node ports, so default to the local server.
// In a production build (single-service deploy, server serves this bundle
// itself) default to same-origin so no build-time backend URL is needed.
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : '');

export const socket: Socket = io(SERVER_URL || undefined, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});

export const SERVER_HTTP_URL = SERVER_URL;

type AckOk<T> = { ok: true; data: T };
type AckErr = { ok: false; error: string };

export function call<T>(event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res: AckOk<T> | AckErr) => {
      if (res.ok) resolve(res.data);
      else reject(new Error(res.error));
    });
  });
}
