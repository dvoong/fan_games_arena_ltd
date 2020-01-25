with events as (
    select 
        events.id as event_id,
        action,
        events."currentUser" as user_id,
        events."userDevice" as device_id,
        events."createdAt"::timestamp as ts,
        devices."DeviceOS" as client

    from events join devices 
        on events."currentUser" = devices."UserID"
        and events."userDevice" = devices."Id"
    
    where action in (
      'APP_STARTUP', 
      'LOADED', 
      'REGISTER_AS_GUEST', 
      'OPEN_TutorialPage', 
      'TUTORIAL_DISMISS', 
      'START_QUIZ', 
      'FINALIZE_QUIZ_SUBMIT'
    )

), session_starts as (
    select
        event_id,
        user_id,
        device_id,
        client,
        ts
        
    from events
    
    where action = 'APP_STARTUP'
    
), session_starts_new_users as (
    select
        event_id,
        user_id,
        device_id,
        client,
        ts
        
    from session_starts join users on user_id = users."Id"
        and users."CreatedAt"::date = ts::date

), session_starts_ordered as (
    select
        event_id,
        user_id,
        device_id,
        client,
        ts,
        row_number() over (partition by user_id order by ts)
        
    from session_starts_new_users
        
), session_starts_first_ever as (
    select
        event_id,
        user_id,
        device_id,
        client,
        ts
        
    from session_starts_ordered
    
    where row_number = 1

), session_events as (
    select
        session_starts_first_ever.event_id as start_event,
        session_starts_first_ever.ts as start_ts,
        user_id,
        device_id,
        client,
        events.event_id,
        events.ts,
        action
        
    from events join session_starts_first_ever
        using (user_id, device_id, client)

    where events.ts >= session_starts_first_ever.ts
        and events.ts < session_starts_first_ever.ts + interval '10 minutes'

), session_events_seen as (
    select
        start_event,
        start_ts,
        user_id,
        device_id,
        client,
        action,
        count(1)
        
    from session_events
    
    group by 1, 2, 3, 4, 5, 6

), session_events_seen_by_date as (
    select
        start_ts::date as date,
        client,
        action,
        count(1)
        
    from session_events_seen
    
    group by 1, 2, 3
    
    order by 1, 3 desc

), sessions_by_date as (
    select
        ts::date as date,
        client,
        count(1)
        
    from session_starts_first_ever
    
    group by 1, 2
    
    order by 1

), activation_funnel as (
    select
        date,
        client,
        action,
        session_events_seen_by_date.count as count,
        sessions_by_date.count as n_new_users,
        session_events_seen_by_date.count::float / sessions_by_date.count as percent
        
    from session_events_seen_by_date join sessions_by_date
        using (date, client)
        
)

select * from activation_funnel
