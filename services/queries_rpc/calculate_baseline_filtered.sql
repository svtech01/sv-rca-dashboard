CREATE OR REPLACE FUNCTION calculate_baseline_metrics_filtered(
    time_filter TEXT DEFAULT 'all'  -- 'today', 'week', 'month', 'all'
)
RETURNS TABLE(
    total_calls INT,
    connected_calls INT,
    connect_rate NUMERIC,
    answer_event_pct NUMERIC,
    avg_attempts_lost_race NUMERIC,
    cooldown_per_day NUMERIC
)
LANGUAGE sql
AS $$
WITH filtered_calls AS (
    SELECT *
    FROM kixie_call_logs
    WHERE
        CASE
            WHEN time_filter = 'today' THEN calldate::date = CURRENT_DATE
            WHEN time_filter = 'week' THEN date_trunc('week', calldate) = date_trunc('week', CURRENT_DATE)
            WHEN time_filter = 'month' THEN date_trunc('month', calldate) = date_trunc('month', CURRENT_DATE)
            ELSE TRUE
        END
),
total_calls_cte AS (
    SELECT COUNT(*) AS total_calls
    FROM filtered_calls
),
connected_calls_cte AS (
    SELECT COUNT(*) AS connected_calls
    FROM filtered_calls
    WHERE disposition IN (
        'Connected', 'Left voicemail', 'DC Booked', 
        'Qualified for Follow up', 'Left Live Message', 'Not Interested'
    )
),
lost_race AS (
    SELECT phone_normalized
    FROM filtered_calls
    WHERE disposition NOT IN (
        'Connected', 'Left voicemail', 'DC Booked', 
        'Qualified for Follow up', 'Left Live Message', 'Not Interested'
    )
    AND phone_normalized IS NOT NULL
),
attempts_per_phone AS (
    SELECT phone_normalized, COUNT(*) AS attempts
    FROM lost_race
    GROUP BY phone_normalized
),
avg_attempts_cte AS (
    SELECT COALESCE(AVG(attempts), 0) AS avg_attempts_lost_race
    FROM attempts_per_phone
),
cooldown_cte AS (
    SELECT CASE WHEN COUNT(*) > 0 THEN COUNT(*)::numeric / 7 ELSE 0 END AS cooldown_per_day
    FROM powerlist
    WHERE attempt_count >= 5
)
SELECT
    tc.total_calls,
    cc.connected_calls,
    CASE WHEN tc.total_calls > 0 THEN (cc.connected_calls::numeric / tc.total_calls) * 100 ELSE 0 END AS connect_rate,
    (tc.total_calls / (tc.total_calls + (tc.total_calls * ((3-1)/3)))) * 100 AS answer_event_pct,
    aa.avg_attempts_lost_race,
    cd.cooldown_per_day
FROM total_calls_cte tc
CROSS JOIN connected_calls_cte cc
CROSS JOIN avg_attempts_cte aa
CROSS JOIN cooldown_cte cd;
$$;
