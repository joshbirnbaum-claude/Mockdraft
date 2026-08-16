interface SeatCredentials {
  teamId: string;
  authToken: string;
}

const seatKey = (code: string) => `mockdraft:seat:${code.toUpperCase()}`;
const NAME_KEY = 'mockdraft:displayName';

export function saveSeat(code: string, creds: SeatCredentials) {
  localStorage.setItem(seatKey(code), JSON.stringify(creds));
}

export function loadSeat(code: string): SeatCredentials | null {
  const raw = localStorage.getItem(seatKey(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SeatCredentials;
  } catch {
    return null;
  }
}

export function clearSeat(code: string) {
  localStorage.removeItem(seatKey(code));
}

export function saveDisplayName(name: string) {
  localStorage.setItem(NAME_KEY, name);
}

export function loadDisplayName(): string {
  return localStorage.getItem(NAME_KEY) ?? '';
}
