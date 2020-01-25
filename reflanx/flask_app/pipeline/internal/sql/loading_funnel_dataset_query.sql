with events as (
    select
        events."currentUser" as user_id,
        events."createdAt"::date as date,
	events."action" as action,
	count(1)

    from events

    group by 1, 2, 3
        
), results as (
    select
        date,
        action,
	count(1)

    from events

    group by 1, 2

)

select * from results
