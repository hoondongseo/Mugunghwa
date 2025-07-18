UPDATE messages
SET
  latitude  = ROUND(CAST(latitude AS numeric), 2)::text,
  longitude = ROUND(CAST(longitude AS numeric), 2)::text;