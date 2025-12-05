CREATE OR REPLACE FUNCTION get_cooldown_contacts_filtered(
    max_attempts INT,
    cooldown_days_param INT,
    date_filter TEXT DEFAULT NULL  -- 'today', 'this_week', 'this_month'
)
RETURNS TABLE(
    cooldown_contacts_count INT,
    reattempt_potential INT,
    target_kpi INT,
    cooldown_days INT,
    cooldown_contacts JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_contacts AS (
        SELECT *
        FROM powerlist_contacts
        WHERE attempt_count >= max_attempts
        -- Apply date filtering if provided
        AND (
            date_filter IS NULL
            OR (date_filter = 'today' AND date_added = CURRENT_DATE)
            OR (date_filter = 'this_week' AND date_trunc('week', date_added) = date_trunc('week', CURRENT_DATE))
            OR (date_filter = 'this_month' AND date_trunc('month', date_added) = date_trunc('month', CURRENT_DATE))
        )
    ),
    cooldown_contacts AS (
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
        FROM filtered_contacts
    )
    SELECT
        COUNT(*)::INT AS cooldown_contacts_count,
        FLOOR(COUNT(*) * 0.15)::INT AS reattempt_potential,
        15 AS target_kpi,
        cooldown_days_param AS cooldown_days,
        json_agg(c) AS cooldown_contacts
    FROM cooldown_contacts AS c;
END;
$$ LANGUAGE plpgsql STABLE;
