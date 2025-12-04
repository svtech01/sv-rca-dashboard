CREATE OR REPLACE FUNCTION get_baseline_pilot_metrics(
    pilot_list_name TEXT,
    target_uplift_pct NUMERIC DEFAULT 15,
    success_uplift_pct NUMERIC DEFAULT 20,
    test_duration INT DEFAULT 3,
    sample_limit INT DEFAULT 100
)
RETURNS TABLE (
    sample_size BIGINT,
    unique_contacts BIGINT,
    baseline_connect_rate NUMERIC,
    target_connect_rate NUMERIC,
    success_criteria NUMERIC,
    test_duration_days INT
)
AS $$
BEGIN
    RETURN QUERY
    WITH pilot AS (
        SELECT *
        FROM powerlist_contacts
        WHERE LOWER(list_type) LIKE LOWER('%' || pilot_list_name || '%')
        LIMIT sample_limit
    ),
    fallback AS (
        SELECT *
        FROM powerlist_contacts
        ORDER BY created_at ASC
        LIMIT sample_limit
    ),
    pilot_sample AS (
        SELECT * FROM pilot
        UNION ALL
        SELECT * FROM fallback WHERE (SELECT COUNT(*) FROM pilot) = 0
    ),
    baseline AS (
        -- Call your existing RPC
        SELECT connect_rate FROM calculate_baseline_metrics()
    ),
    sample_metrics AS (
        SELECT
            COUNT(*)::BIGINT AS sample_size,
            COUNT(DISTINCT phone_number)::BIGINT AS unique_contacts
        FROM pilot_sample
    )
    SELECT
        sample_metrics.sample_size,
        sample_metrics.unique_contacts,
        baseline.connect_rate as baseline_connect_rate,
        baseline.connect_rate * (1 + target_uplift_pct / 100) AS target_connect_rate,
        baseline.connect_rate * (1 + success_uplift_pct / 100) AS success_criteria,
        test_duration AS test_duration_days
    FROM sample_metrics, baseline;
END;
$$ LANGUAGE plpgsql STABLE;
