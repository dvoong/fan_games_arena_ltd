with events_ as (
    select
        "createdAt" as ts,
        "currentUser" as user_id,
        "userDevice" as device_id
        
    from events
    
), first_event as (
    select min(ts) as first_event_ts from events_ 
), devices_ as (
    select
        "Id" as device_id,
        "DeviceOS" as client,
        "UserID" as user_id,
        "CreatedAt" as created_at
        
    from devices
    
), device_count as (
    select
        user_id,
        device_id,
        client,
        created_at,
        row_number() over (partition by user_id order by created_at) as device_count
        
    from devices_
    
    order by 1

), users_ as (
    select
        user_id,
        device_id,
        client,
        created_at
        
    from device_count
    
    where device_count = 1

), cohort_sizes as (
    select
        created_at::date as date,
        client,
        count(distinct user_id) as cohort_size
        
    from users_ join first_event on 1=1

    where created_at::timestamp >= date_trunc('d', first_event_ts::timestamp) + interval '1 day'
    
    group by 1, 2
    
    order by 1, 2
        
), w1_active_users as (
    select
        created_at::date as date,
        client,
        count(distinct events_.user_id) as w1_active_users
        
    from events_ join users_ using (user_id)
        
    where date_trunc('w', ts::timestamp) = date_trunc('w', created_at::timestamp) + interval '7 day'
    
    group by 1, 2
    
), w2_active_users as (
    select
        created_at::date as date,
        client,
        count(distinct events_.user_id) as w2_active_users
        
    from events_ join users_ using (user_id)
        
    where date_trunc('w', ts::timestamp) = date_trunc('w', created_at::timestamp) + interval '14 day'
    
    group by 1, 2
    
), w3_active_users as (
    select
        created_at::date as date,
        client,
        count(distinct events_.user_id) as w3_active_users
        
    from events_ join users_ using (user_id)

    where date_trunc('w', ts::timestamp) = date_trunc('w', created_at::timestamp) + interval '21 day'
    
    group by 1, 2
    
), w4_active_users as (
    select
        created_at::date as date,
        client,
        count(distinct events_.user_id) as w4_active_users
        
    from events_ join users_ using (user_id)
        
    where date_trunc('w', ts::timestamp) = date_trunc('w', created_at::timestamp) + interval '28 day'
    
    group by 1, 2
    
), results as (
    select
        date,
        client,
        coalesce(w1_active_users, 0) as w1_active_users,
        coalesce(w2_active_users, 0) as w2_active_users,
        coalesce(w3_active_users, 0) as w3_active_users,
        coalesce(w4_active_users, 0) as w4_active_users,
	cohort_size
        
    from cohort_sizes
    	left join w1_active_users using (date, client)
        left join w2_active_users using (date, client)
        left join w3_active_users using (date, client)
        left join w4_active_users using (date, client)

    where w1_active_users is not null
        or w2_active_users is not null
	or w3_active_users is not null
	or w4_active_users is not null

)

select * from results
