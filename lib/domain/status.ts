export const requestStatuses = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

const transitions: Record<RequestStatus, readonly RequestStatus[]> = {
  pending: ["approved", "rejected", "cancelled"],
  approved: [],
  rejected: [],
  cancelled: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return transitions[from].includes(to);
}

export function isTerminalStatus(status: RequestStatus): boolean {
  return transitions[status].length === 0;
}
