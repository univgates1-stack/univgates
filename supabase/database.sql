CREATE OR REPLACE FUNCTION ensure_university_official(profile_email text, profile_first_name text, profile_last_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_official RECORD;
BEGIN
  SELECT u.id, u.email
    INTO v_user
    FROM auth.users u
    WHERE lower(u.email) = lower(profile_email);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT id
    INTO v_official
    FROM university_officials
    WHERE user_id = v_user.id
    LIMIT 1;

  IF v_official.id IS NULL THEN
    INSERT INTO university_officials (user_id, authorized_person_name, authorized_person_email, status)
    VALUES (
      v_user.id,
      trim(coalesce(profile_first_name, '') || ' ' || coalesce(profile_last_name, '')),
      v_user.email,
      'pending'
    )
    RETURNING id INTO v_official;
  END IF;

  RETURN v_official.id;
END;
$$;

CREATE OR REPLACE FUNCTION ensure_university_official_profile(p_first_name text, p_last_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_full_name text := trim(coalesce(p_first_name, '') || ' ' || coalesce(p_last_name, ''));
  v_official_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;

  SELECT email
    INTO v_email
    FROM auth.users
    WHERE id = v_user_id;

  IF v_email IS NULL THEN
    v_email := '';
  END IF;

  INSERT INTO users (id, email, first_name, last_name)
  VALUES (
    v_user_id,
    v_email,
    NULLIF(p_first_name, ''),
    NULLIF(p_last_name, '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

  INSERT INTO university_officials (
    user_id,
    authorized_person_name,
    authorized_person_email,
    status
  )
  VALUES (
    v_user_id,
    NULLIF(v_full_name, ''),
    v_email,
    'pending'
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_official_id;

  IF v_official_id IS NULL THEN
    SELECT id
    INTO v_official_id
    FROM university_officials
    WHERE user_id = v_user_id
    LIMIT 1;
  END IF;

  RETURN v_official_id;
END;
$$;
