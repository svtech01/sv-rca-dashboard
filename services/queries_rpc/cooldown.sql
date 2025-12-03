CREATE OR REPLACE FUNCTION get_cooldown_contacts(max_attempts INT, cooldown_days_param INT)
RETURNS TABLE(
  cooldown_contacts_count INT,
  reattempt_potential INT,
  target_kpi INT,
  cooldown_days INT,
  cooldown_contacts JSON
) AS $$
BEGIN
  RETURN QUERY
  WITH cooldown_contacts AS (
    SELECT
      id,
      phone_number,
      list_type,
      attempt_count,
      CURRENT_DATE AS cooldown_start,
      (CURRENT_DATE + (cooldown_days_param || ' days')::interval)::date AS cooldown_end,
      'System' AS owner,
      (CURRENT_DATE + (cooldown_days_param || ' days')::interval)::date AS review_date,
      'In Cooldown' AS status
    FROM powerlist_contacts
    WHERE attempt_count >= max_attempts
  )
  SELECT
    COUNT(*)::INT AS cooldown_contacts_count,
    FLOOR(COUNT(*) * 0.15)::INT AS reattempt_potential,
    15 AS target_kpi,
    cooldown_days_param AS cooldown_days,
    json_agg(c) AS cooldown_contacts
  FROM cooldown_contacts AS c;
END;
$$ LANGUAGE plpgsql;
