// Port for realtime updates: the app depends on this interface, not on
// Supabase. Swapping in Pusher (or anything else) means writing one adapter.
export interface RealtimeAdapter {
  // Returns an unsubscribe function
  subscribeToJamLoops(jamId: string, onLoopAdded: () => void): () => void;
}
