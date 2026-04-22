
CREATE TABLE IF NOT EXISTS public.progress_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  before_photo_id UUID NOT NULL REFERENCES public.progress_photos(id) ON DELETE CASCADE,
  after_photo_id UUID NOT NULL REFERENCES public.progress_photos(id) ON DELETE CASCADE,
  ai_summary TEXT,
  ai_changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_comparisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own comparisons" ON public.progress_comparisons;
DROP POLICY IF EXISTS "Users insert own comparisons" ON public.progress_comparisons;
DROP POLICY IF EXISTS "Users delete own comparisons" ON public.progress_comparisons;

CREATE POLICY "Users view own comparisons" ON public.progress_comparisons
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own comparisons" ON public.progress_comparisons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comparisons" ON public.progress_comparisons
  FOR DELETE USING (auth.uid() = user_id);

-- Storage policies (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users view own progress photo files') THEN
    CREATE POLICY "Users view own progress photo files"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users upload own progress photo files') THEN
    CREATE POLICY "Users upload own progress photo files"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users delete own progress photo files') THEN
    CREATE POLICY "Users delete own progress photo files"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
