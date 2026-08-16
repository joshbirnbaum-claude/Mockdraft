import { io, type Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';

export const socket: Socket = io(SERVER_URL, {
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
