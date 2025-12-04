CREATE OR REPLACE FUNCTION get_baseline_pilot_metrics_filtered(
    pilot_list_name TEXT,
    date_filter TEXT DEFAULT 'all',
    sample_limit INT DEFAULT 100,
    target_uplift_pct NUMERIC DEFAULT 15,
    success_uplift_pct NUMERIC DEFAULT 20,
    test_duration INT DEFAULT 3
)
RETURNS TABLE (
    sample_size BIGINT,
    unique_contacts BIGINT,
    baseline_connect_rate NUMERIC,
    target_connect_rate NUMERIC,
    success_criteria NUMERIC,
    test_duration_days INT
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    date_from DATE;
BEGIN
    -- Determine start date based on filter
    date_from := CASE date_filter
                    WHEN 'today' THEN CURRENT_DATE
                    WHEN 'week' THEN date_trunc('week', CURRENT_DATE)::date
                    WHEN 'month' THEN date_trunc('month', CURRENT_DATE)::date
                    ELSE NULL
                 END;

    RETURN QUERY
    WITH pilot_raw AS (
        SELECT *
        FROM powerlist_contacts
        WHERE LOWER(list_type) LIKE LOWER('%' || pilot_list_name || '%')
          AND (date_from IS NULL OR date_added >= date_from)
        ORDER BY created_at ASC
        LIMIT sample_limit
    ),
    fallback_raw AS (
        SELECT *
        FROM powerlist_contacts
        WHERE (date_from IS NULL OR date_added >= date_from)
        ORDER BY created_at ASC
        LIMIT sample_limit
    ),
    pilot_sample AS (
        SELECT * FROM pilot_raw
        UNION ALL
        SELECT * FROM fallback_raw WHERE (SELECT COUNT(*) FROM pilot_raw) = 0
    ),
    sample_metrics AS (
        SELECT
            COUNT(*)::BIGINT AS sample_size,
            COUNT(DISTINCT phone_number)::BIGINT AS unique_contacts
        FROM pilot_sample
    ),
    baseline AS (
        SELECT connect_rate
        FROM calculate_baseline_metrics_filtered(date_filter)
    )
    SELECT
        sample_metrics.sample_size,
        sample_metrics.unique_contacts,
        baseline.connect_rate AS baseline_connect_rate,
        baseline.connect_rate * (1 + target_uplift_pct / 100) AS target_connect_rate,
        baseline.connect_rate * (1 + target_uplift_pct / 100) * (1 + success_uplift_pct / 100) AS success_criteria,
        test_duration AS test_duration_days
    FROM sample_metrics, baseline;
END;
$$;
