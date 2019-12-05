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
        client,
        case when
            events_.ts::date = users_.created_at::date then 'new'
            else 'existing'
        end as tenure_type,
        count(distinct user_id) as dau
        
    from events_ join users_ using (user_id)
        join devices_ using (device_id)
    
    group by 1, 2, 3
    
    order by 1, 2, 3

)

select * from results
