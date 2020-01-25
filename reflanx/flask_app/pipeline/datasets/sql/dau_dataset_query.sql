with events_ as (
    select
        "createdAt" as ts,
        "currentUser" as user_id,
        "userDevice" as device_id
        
    from 
    
    events
    
), users_ as (
    select
        "Id" as user_id,
        "CreatedAt" as created_at
        
    from users
    
), devices_ as (
    select
        "Id" as device_id,
        "DeviceOS" as client
        
    from devices
    
), results as (
    select
        ts::date as date,
	coalesce(client, 'Unknown') as client,
        case
	    when events_.ts::date = users_.created_at::date then 'new'
            when events_.ts::date > users_.created_at::date then 'existing'
	    else 'unknown'
        end as tenure_type,
        count(distinct user_id) as dau
        
    from events_
    	 left join users_ using (user_id)
	 left join devices_ using (device_id)
    
    group by 1, 2, 3
    
    order by 1, 2, 3

)

select * from results
