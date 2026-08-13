-- Cria um Profile público na mesma transação que cadastra a identidade no Supabase Auth.
CREATE OR REPLACE FUNCTION public.create_profile_for_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  raw_display_name TEXT;
  safe_display_name TEXT;
BEGIN
  IF jsonb_typeof(NEW.raw_user_meta_data -> 'display_name') = 'string' THEN
    raw_display_name := NEW.raw_user_meta_data ->> 'display_name';
  END IF;

  safe_display_name := LEFT(
    NULLIF(
      BTRIM(REGEXP_REPLACE(raw_display_name, '[[:space:]]+', ' ', 'g')),
      ''
    ),
    120
  );

  INSERT INTO public."Profile" ("id", "displayName", "updatedAt")
  VALUES (
    NEW.id,
    COALESCE(safe_display_name, 'Leitor'),
    CURRENT_TIMESTAMP
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_profile_for_new_auth_user() FROM PUBLIC;

CREATE TRIGGER vavito_create_profile_after_auth_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_new_auth_user();
