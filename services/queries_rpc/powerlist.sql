CREATE OR REPLACE FUNCTION get_pilot_metrics(
    pilot_list_name TEXT,
    sample_size INT DEFAULT 100,
    target_connect_uplift_pct NUMERIC DEFAULT 10, -- e.g. 10%
    success_connect_uplift_pct NUMERIC DEFAULT 5,
    success_voicemail_uplift_pct NUMERIC DEFAULT 5,
    dial_at_a_time INT DEFAULT 5,
    max_attempts INT DEFAULT 3
)
RETURNS TABLE(
    sample_size INT,
    target_connect_rate NUMERIC,
    target_connect_uplift_pct NUMERIC,
    success_connect_uplift_pct NUMERIC,
    success_voicemail_uplift_pct NUMERIC,
    test_duration_days INT,
    dial_at_a_time INT,
    max_attempts INT
) AS $$
DECLARE
    pilot_rows JSON;
    total_calls INT;
    connected_calls INT;
    baseline_connect_rate NUMERIC;
BEGIN
    -- 1️⃣ Select pilot contacts or fallback sample
    SELECT json_agg(pc.*) INTO pilot_rows
    FROM (
        SELECT *
        FROM powerlist_contacts
        WHERE lower(list_name) LIKE '%' || lower(pilot_list_name) || '%'
        LIMIT sample_size
    ) pc;

    -- fallback: take first sample_size if none matched
    IF pilot_rows IS NULL THEN
        SELECT json_agg(pc.*) INTO pilot_rows
        FROM (
            SELECT *
            FROM powerlist_contacts
            LIMIT sample_size
        ) pc;
    END IF;

    -- 2️⃣ Compute baseline metrics
    SELECT
        COUNT(*) AS total_calls,
        SUM(CASE WHEN connected::INT = 1 THEN 1 ELSE 0 END) AS connected_calls
    INTO total_calls, connected_calls
    FROM json_to_recordset(pilot_rows)
        AS r(id INT, phone_number TEXT, list_name TEXT, attempt_count INT, connected INT);

    baseline_connect_rate := CASE WHEN total_calls > 0 THEN connected_calls::NUMERIC / total_calls ELSE 0 END;

    RETURN QUERY SELECT
        GREATEST(total_calls, sample_size) AS sample_size,
        ROUND(baseline_connect_rate * (1 + target_connect_uplift_pct/100), 2) AS target_connect_rate,
        target_connect_uplift_pct,
        success_connect_uplift_pct,
        success_voicemail_uplift_pct,
        3 AS test_duration_days,
        dial_at_a_time,
        max_attempts;
END;
$$ LANGUAGE plpgsql;
