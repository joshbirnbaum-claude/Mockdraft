import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { ADP_PLAYERS } from './data/adp.js';
import { DraftEngine, EngineError } from './draft/engine.js';
import { sanitizeRoom } from './rooms/roomInternal.js';
import type { DraftSettings } from '../../shared/types.js';

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/players', (_req, res) => res.json(ADP_PLAYERS));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

const engine = new DraftEngine(io);

type Ack<T> = (response: { ok: true; data: T } | { ok: false; error: string }) => void;

function safe<T>(ack: Ack<T> | undefined, fn: () => T) {
  try {
    const data = fn();
    ack?.({ ok: true, data });
  } catch (err) {
    const message = err instanceof EngineError ? err.message : 'Unexpected server error';
    if (!(err instanceof EngineError)) console.error(err);
    ack?.({ ok: false, error: message });
  }
}

io.on('connection', (socket) => {
  socket.on('room:create', (payload: { hostName: string; settings: Partial<DraftSettings> }, ack: Ack<unknown>) => {
    safe(ack, () => {
      const { room, teamId, authToken } = engine.createRoom(payload.hostName, payload.settings ?? {});
      socket.join(room.code);
      return { room: sanitizeRoom(room), teamId, authToken };
    });
  });

  socket.on('room:join', (payload: { code: string; name: string; teamId?: string }, ack: Ack<unknown>) => {
    safe(ack, () => {
      const { room, teamId, authToken } = engine.joinRoom(payload.code, payload.name, payload.teamId);
      socket.join(room.code.toUpperCase());
      return { room: sanitizeRoom(room), teamId, authToken };
    });
  });

  socket.on('room:peek', (payload: { code: string }, ack: Ack<unknown>) => {
    safe(ack, () => {
      const room = engine.peek(payload.code);
      socket.join(room.code);
      return { room: sanitizeRoom(room) };
    });
  });

  socket.on('room:rejoin', (payload: { code: string; teamId: string; authToken: string }, ack: Ack<unknown>) => {
    safe(ack, () => {
      const room = engine.rejoin(payload.code, payload.teamId, payload.authToken);
      socket.join(room.code);
      return { room: sanitizeRoom(room) };
    });
  });

  socket.on(
    'room:updateSettings',
    (payload: { code: string; teamId: string; authToken: string; settings: Partial<DraftSettings> }, ack: Ack<unknown>) => {
      safe(ack, () => {
        const room = engine.updateSettings(payload.code, payload.teamId, payload.authToken, payload.settings);
        return { room: sanitizeRoom(room) };
      });
    },
  );

  socket.on('room:setReady', (payload: { code: string; teamId: string; authToken: string; ready: boolean }, ack: Ack<unknown>) => {
    safe(ack, () => {
      const room = engine.setReady(payload.code, payload.teamId, payload.authToken, payload.ready);
      return { room: sanitizeRoom(room) };
    });
  });

  socket.on('room:rename', (payload: { code: string; teamId: string; authToken: string; name: string }, ack: Ack<unknown>) => {
    safe(ack, () => {
      const room = engine.renameTeam(payload.code, payload.teamId, payload.authToken, payload.name);
      return { room: sanitizeRoom(room) };
    });
  });

  socket.on('room:start', (payload: { code: string; teamId: string; authToken: string }, ack: Ack<unknown>) => {
    safe(ack, () => {
      const room = engine.startDraft(payload.code, payload.teamId, payload.authToken);
      return { room: sanitizeRoom(room) };
    });
  });

  socket.on('draft:pick', (payload: { code: string; teamId: string; authToken: string; playerId: string }, ack: Ack<unknown>) => {
    safe(ack, () => {
      const room = engine.makePick(payload.code, payload.teamId, payload.authToken, payload.playerId);
      return { room: sanitizeRoom(room) };
    });
  });

  socket.on('draft:results', (payload: { code: string }, ack: Ack<unknown>) => {
    safe(ack, () => ({ teamGrades: engine.getResults(payload.code) }));
  });

  socket.on('draft:setQueue', (payload: { code: string; teamId: string; authToken: string; playerIds: string[] }, ack: Ack<unknown>) => {
    safe(ack, () => {
      engine.setQueue(payload.code, payload.teamId, payload.authToken, payload.playerIds);
      return { ok: true };
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Mock draft server listening on :${PORT}`);
});
