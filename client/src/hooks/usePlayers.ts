import { useEffect, useState } from 'react';
import { fetchPlayers } from '../api/rooms';
import type { Player } from '../../../shared/types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchPlayers()
      .then((p) => {
        if (alive) setPlayers(p);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { players, loading };
}
