-- Tasks can span a date range (e.g. starts Sep 20, due Sep 25), not just a
-- single due date.
alter table tasks add column start_date date;
