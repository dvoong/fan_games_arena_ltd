with users_ as (
    select
        "CreatedAt" as created_at,
        "UserID" as user_id,
        "DeviceOS" as client
        
    from devices

), events_ as (
    select
        "createdAt" as ts,
        "currentUser" as user_id,
        "action" as action
        
    from events
    
), quiz_events as (
    select
        ts,
        user_id
        
    from events_
    
    where action = 'START_QUIZ'
    
), n_submitted_quiz as (
    select
        created_at::date as date,
        client,
        count(distinct user_id) as n_submitted_quiz
        
    from users_ join quiz_events using (user_id)
    
    where ts >= created_at
        and ts::timestamp < created_at::timestamp + interval '1 day'
        
    group by 1, 2
        
), n_new_users as (
    select
        "CreatedAt"::date as date,
        "DeviceOS" as client,
        count(distinct "UserID") as n_new_users
        
    from devices
    
    group by 1, 2
    
), results as (
    select
        date,
        client,
        n_new_users,
        n_submitted_quiz,
        n_submitted_quiz::float / n_new_users * 100 as percent
        
    from n_new_users
        join n_submitted_quiz using (date, client)

)

select * from results
