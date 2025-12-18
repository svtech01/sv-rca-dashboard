create or replace function get_contacts_with_count(
  date_filter text
)
returns table (
  phone_number_e164 text,
  is_reachable boolean,
  total_count bigint
)
language plpgsql
as $$
declare
  date_from date;
begin
  -- Determine start date based on filter
  date_from := case date_filter
    when 'today' then current_date
    when 'week'  then date_trunc('week', current_date)::date
    when 'month' then date_trunc('month', current_date)::date
    else null
  end;

  if date_from is null then
    return;
  end if;

  return query
  select
    c.phone_number_e164,
    c.is_reachable,
    count(*) over () as total_count
  from contacts c
  where c.created_at >= date_from;
end;
$$;
