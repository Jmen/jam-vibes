-- Broadcast loop inserts so jam pages update live when someone commits a loop.
-- RLS applies to subscribers: anon subscribers only receive rows from public jams.
ALTER PUBLICATION supabase_realtime ADD TABLE public.loops;
