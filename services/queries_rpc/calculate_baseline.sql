create or replace function calculate_baseline_metrics()
returns table(
  total_calls int,
  connected_calls int,
  connect_rate numeric,
  answer_event_pct numeric,
  avg_attempts_lost_race numeric,
  cooldown_per_day numeric
)
language sql
as $$
WITH
total_calls_cte AS (
  SELECT COUNT(*) AS total_calls
  FROM kixie_call_logs
),
connected_calls_cte AS (
  SELECT COUNT(*) AS connected_calls
  FROM kixie_call_logs
  WHERE disposition IN (
    'Connected', 'Left voicemail', 'DC Booked', 
    'Qualified for Follow up', 'Left Live Message', 'Not Interested'
  )
),
lost_race AS (
  SELECT phone_normalized
  FROM kixie_call_logs
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
  SELECT COALESCE(AVG(attempts),0) AS avg_attempts_lost_race
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
