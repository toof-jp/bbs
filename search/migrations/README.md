# migrations
```
sqlx migrate run
```

```
pg_dump $DATABSE_URL \
    --data-only \
    -t public.res \
    -t public.oekaki \
    > data.sql
```

```
psql $DATABASE_URL < data.sql
```
