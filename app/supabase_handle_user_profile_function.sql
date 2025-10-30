-- Create a function to handle user profile updates across tables
CREATE OR REPLACE FUNCTION handle_user_profile(
  p_user_data JSONB,
  p_profile_data JSONB,
  p_profile_type TEXT
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_profile_table TEXT;
  v_profile_id_column TEXT;
  v_profile_columns TEXT;
  v_profile_values TEXT;
  v_update_columns TEXT;
  v_upsert_sql TEXT;
  v_select_sql TEXT;
  v_user_type_exists BOOLEAN;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if user exists
    IF (p_user_data->>'id')::TEXT IS NOT NULL THEN
      -- Update existing user
      UPDATE users
      SET 
        first_name = COALESCE(p_user_data->>'first_name', first_name),
        last_name = COALESCE(p_user_data->>'last_name', last_name),
        phone = COALESCE(p_user_data->>'phone', phone),
        country = COALESCE(p_user_data->>'country', country),
        city = COALESCE(p_user_data->>'city', city),
        date_of_birth = COALESCE((p_user_data->>'date_of_birth')::DATE, date_of_birth),
        gender = COALESCE(p_user_data->>'gender', gender),
        user_type = COALESCE(p_user_data->>'user_type', user_type),
        profile_image = COALESCE(p_user_data->>'profile_image', profile_image),
        wallet_address = COALESCE(p_user_data->>'wallet_address', wallet_address),
        updated_at = NOW()
      WHERE id = (p_user_data->>'id')::UUID
      RETURNING id INTO v_user_id;
    ELSE
      -- Insert new user
      INSERT INTO users (
        email,
        first_name,
        last_name,
        phone,
        country,
        city,
        date_of_birth,
        gender,
        user_type,
        profile_image,
        wallet_address
      ) VALUES (
        p_user_data->>'email',
        p_user_data->>'first_name',
        p_user_data->>'last_name',
        p_user_data->>'phone',
        p_user_data->>'country',
        p_user_data->>'city',
        (p_user_data->>'date_of_birth')::DATE,
        p_user_data->>'gender',
        p_user_data->>'user_type',
        p_user_data->>'profile_image',
        p_user_data->>'wallet_address'
      )
      RETURNING id INTO v_user_id;
    END IF;

    -- If we have profile data, handle the type-specific table
    IF p_profile_data IS NOT NULL AND p_profile_type IS NOT NULL THEN
      -- Determine the profile table name
      v_profile_table := p_profile_type || '_profiles';
      v_profile_id_column := 'user_profile_id';

      -- Check if the profile table exists
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = v_profile_table
      ) INTO v_user_type_exists;

      IF v_user_type_exists THEN
        -- Build dynamic SQL for profile upsert
        SELECT 
          string_agg(format('%I', key), ', '),
          string_agg(format('%L', value), ', '),
          string_agg(format('%I = EXCLUDED.%I', key, key), ', ')
        INTO 
          v_profile_columns,
          v_profile_values,
          v_update_columns
        FROM jsonb_each_text(p_profile_data);

        -- Add user_profile_id to columns and values
        v_profile_columns := 'user_profile_id, ' || v_profile_columns;
        v_profile_values := v_user_id || ', ' || v_profile_values;

        -- Build and execute the upsert
        v_upsert_sql := format(
          'INSERT INTO %I (%s) VALUES (%s) ' ||
          'ON CONFLICT (user_profile_id) DO UPDATE SET %s ' ||
          'RETURNING *',
          v_profile_table,
          v_profile_columns,
          v_profile_values,
          v_update_columns
        );

        EXECUTE v_upsert_sql;
      END IF;
    END IF;

    -- Build the result
    SELECT jsonb_build_object(
      'id', v_user_id,
      'email', p_user_data->>'email',
      'user_type', p_user_data->>'user_type',
      'profile_updated', TRUE
    ) INTO v_result;

    -- Commit the transaction
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction on error
      RAISE EXCEPTION 'Error in handle_user_profile: %', SQLERRM;
  END;
END;
$$;
