CREATE OR REPLACE FUNCTION get_weekly_trends()
RETURNS TABLE (
    week_label TEXT[],
    total_calls INT[],
    connected_calls INT[],
    voicemail_calls INT[],
    no_answer_calls INT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    weekly RECORD;
    weeks TEXT[] := '{}';
    totals INT[] := '{}';
    connected INT[] := '{}';
    voicemail INT[] := '{}';
    no_answer INT[] := '{}';
BEGIN
    FOR weekly IN
        SELECT
            TO_CHAR(calldate, 'IYYY-IW') AS week_label,
            COUNT(*) AS total_calls,
            SUM(CASE WHEN Disposition = ANY(ARRAY['Connected', 'Left voicemail', 'DC Booked', 
    'Qualified for Follow up', 'Left Live Message', 'Not Interested']) THEN 1 ELSE 0 END) AS connected_calls,
            SUM(CASE WHEN Disposition = 'Left voicemail' THEN 1 ELSE 0 END) AS voicemail_calls,
            SUM(CASE WHEN Disposition <> ALL(ARRAY['Connected', 'Left voicemail', 'DC Booked', 
    'Qualified for Follow up', 'Left Live Message', 'Not Interested']) THEN 1 ELSE 0 END) AS no_answer_calls
        FROM kixie_call_logs
        WHERE calldate IS NOT NULL
        GROUP BY week_label
        ORDER BY week_label
    LOOP
        weeks := array_append(weeks, weekly.week_label);
        totals := array_append(totals, weekly.total_calls);
        connected := array_append(connected, weekly.connected_calls);
        voicemail := array_append(voicemail, weekly.voicemail_calls);
        no_answer := array_append(no_answer, weekly.no_answer_calls);
    END LOOP;

    RETURN QUERY SELECT weeks, totals, connected, voicemail, no_answer;
END;
$$;
