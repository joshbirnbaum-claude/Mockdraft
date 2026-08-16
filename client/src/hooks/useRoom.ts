import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../api/socket';
import { RoomApi } from '../api/rooms';
import { clearSeat, loadSeat, saveSeat } from '../api/session';
import type { DraftResults, DraftSettings, RoomState } from '../../../shared/types';

export type JoinPhase = 'loading' | 'need-join' | 'joined' | 'not-found';

interface Seat {
  teamId: string;
  authToken: string;
}

export function useRoom(code: string) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [seat, setSeat] = useState<Seat | null>(null);
  const [phase, setPhase] = useState<JoinPhase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DraftResults | null>(null);
  const seatRef = useRef<Seat | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const stored = loadSeat(code);
    if (stored) {
      try {
        const res = await RoomApi.rejoin(code, stored.teamId, stored.authToken);
        setRoom(res.room);
        setSeat(stored);
        seatRef.current = stored;
        setPhase('joined');
        return;
      } catch {
        clearSeat(code);
      }
    }
    try {
      const res = await RoomApi.peek(code);
      setRoom(res.room);
      setSeat(null);
      seatRef.current = null;
      setPhase('need-join');
    } catch {
      setPhase('not-found');
    }
  }, [code]);

  useEffect(() => {
    if (room?.status === 'complete' && !results) {
      RoomApi.results(code)
        .then(setResults)
        .catch(() => {});
    }
  }, [room?.status, results, code]);

  useEffect(() => {
    refresh();
    const onState = (next: RoomState) => {
      if (next.code === code) setRoom(next);
    };
    const onComplete = (payload: DraftResults) => setResults(payload);
    const onConnect = () => refresh();
    socket.on('room:state', onState);
    socket.on('draft:complete', onComplete);
    socket.on('connect', onConnect);
    return () => {
      socket.off('room:state', onState);
      socket.off('draft:complete', onComplete);
      socket.off('connect', onConnect);
    };
  }, [code, refresh]);

  const join = useCallback(
    async (name: string, teamId?: string) => {
      const res = await RoomApi.join(code, name, teamId);
      saveSeat(code, { teamId: res.teamId, authToken: res.authToken });
      setSeat({ teamId: res.teamId, authToken: res.authToken });
      seatRef.current = { teamId: res.teamId, authToken: res.authToken };
      setRoom(res.room);
      setPhase('joined');
    },
    [code],
  );

  const withSeat = useCallback(
    <A extends unknown[], R>(fn: (code: string, teamId: string, authToken: string, ...args: A) => Promise<R>) =>
      async (...args: A) => {
        const s = seatRef.current;
        if (!s) throw new Error('Join the room first');
        return fn(code, s.teamId, s.authToken, ...args);
      },
    [code],
  );

  const updateSettings = useCallback(
    (settings: Partial<DraftSettings>) => withSeat(RoomApi.updateSettings)(settings),
    [withSeat],
  );
  const setReady = useCallback((ready: boolean) => withSeat(RoomApi.setReady)(ready), [withSeat]);
  const rename = useCallback((name: string) => withSeat(RoomApi.rename)(name), [withSeat]);
  const start = useCallback(() => withSeat(RoomApi.start)(), [withSeat]);
  const pick = useCallback((playerId: string) => withSeat(RoomApi.pick)(playerId), [withSeat]);
  const setQueue = useCallback((playerIds: string[]) => withSeat(RoomApi.setQueue)(playerIds), [withSeat]);

  return { room, seat, phase, error, results, join, updateSettings, setReady, rename, start, pick, setQueue, refresh };
}
