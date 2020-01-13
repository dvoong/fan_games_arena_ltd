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
        
), d1_active_users as (
    select
        created_at::date as date,
        client,
        count(distinct events_.user_id) as d1_active_users
        
    from events_ join users_ using (user_id)
        
    where ts::date = created_at::date + 1
    
    group by 1, 2
    
), d7_active_users as (
    select
        created_at::date as date,
        client,
        count(distinct events_.user_id) as d7_active_users
        
    from events_ join users_ using (user_id)
        
    where ts::date = created_at::date + 7
    
    group by 1, 2
    
), d14_active_users as (
    select
        created_at::date as date,
        client,
        count(distinct events_.user_id) as d14_active_users
        
    from events_ join users_ using (user_id)
        
    where ts::date = created_at::date + 14
    
    group by 1, 2
    
), d28_active_users as (
    select
        created_at::date as date,
        client,
        count(distinct events_.user_id) as d28_active_users
        
    from events_ join users_ using (user_id)
        
    where ts::date = created_at::date + 28
    
    group by 1, 2
    
), results as (
    select
        date,
        client,
        coalesce(d1_active_users, 0) as d1_active_users,
        coalesce(d7_active_users, 0) as d7_active_users,
        coalesce(d14_active_users, 0) as d14_active_users,
        coalesce(d28_active_users, 0) as d28_active_users,
	cohort_size
        
    from cohort_sizes
    	left join d1_active_users using (date, client)
        left join d7_active_users using (date, client)
        left join d14_active_users using (date, client)
        left join d28_active_users using (date, client)

    where d1_active_users is not null
        or d7_active_users is not null
	or d14_active_users is not null
	or d28_active_users is not null

)

select * from results
