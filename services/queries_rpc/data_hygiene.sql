CREATE OR REPLACE FUNCTION get_data_hygiene_metrics()
RETURNS TABLE (
    total_validated INT,
    reachable_count INT,
    reachable_rate NUMERIC,
    invalid_count INT,
    invalid_pct NUMERIC,
    validated_dialed_count INT,
    validated_dialed_pct NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH 
    ts AS (
        SELECT phone_number_e164, is_reachable
        FROM contacts
        WHERE phone_number_e164 IS NOT NULL
    ),
    ts_stats AS (
        SELECT
            COUNT(*) AS total_validated,
            COUNT(*) FILTER (WHERE is_reachable = true) AS reachable_count
        FROM ts
    ),
    kx AS (
        SELECT DISTINCT phoneNormalized
        FROM kixie_call_logs
        WHERE phoneNormalized IS NOT NULL
    ),
    validated_dialed AS (
        SELECT COUNT(*) AS validated_dialed_count
        FROM ts
        WHERE phone_number_e164 IN (SELECT phoneNormalized FROM kx)
    )
    SELECT
        ts_stats.total_validated,
        ts_stats.reachable_count,
        CASE 
            WHEN ts_stats.total_validated > 0 
            THEN (ts_stats.reachable_count::decimal / ts_stats.total_validated) * 100
            ELSE 0
        END AS reachable_rate,
        (ts_stats.total_validated - ts_stats.reachable_count) AS invalid_count,
        CASE 
            WHEN ts_stats.total_validated > 0 
            THEN ROUND(((ts_stats.total_validated - ts_stats.reachable_count)::decimal 
                        / ts_stats.total_validated) * 100, 2)
            ELSE 0
        END AS invalid_pct,
        validated_dialed.validated_dialed_count,
        CASE 
            WHEN ts_stats.total_validated > 0 
            THEN ROUND((validated_dialed.validated_dialed_count::decimal 
                        / ts_stats.total_validated) * 100, 2)
            ELSE 0
        END AS validated_dialed_pct
    FROM ts_stats, validated_dialed;
END;
$$;
