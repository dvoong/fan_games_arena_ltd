with users_ as (
    select
        user_id,
        client,
        created_at
        
    from (
        select
            "UserID" as user_id,
            "DeviceOS" as client,
            "CreatedAt"::timestamp as created_at,
            row_number() over (partition by "UserID" order by "CreatedAt")
            
        from devices
    ) u
    
    where row_number = 1

), events_ as (
    select
        "createdAt"::timestamp as ts,
        "currentUser" as user_id,
        "action" as action
        
    from events

), quiz_events as (
    select
        ts,
        user_id
        
    from events_
    
    where action = 'START_QUIZ'

), n_quizzes_submitted as (
    select
        created_at::date as date,
        client,
        count(1) as n_quizzes_submitted
        
    from quiz_events 
        join users_ using (user_id)
        
    where ts >= created_at
        and ts < created_at + interval '1 day'
        
    group by 1, 2
    
), n_new_users as (
    select
        created_at::date as date,
        client,
        count(user_id) as n_new_users
        
    from users_
    
    group by 1, 2
    
), results as (
    select
        date, 
        client,
        --n_quizzes_submitted,
        --n_new_users,
        n_quizzes_submitted::float / n_new_users as mean_n_quizzes_submitted_by_new_users
        
    from n_new_users
        join n_quizzes_submitted
        
    using (date, client)
    
    order by 1, 2

)

select * from results
