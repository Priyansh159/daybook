-- Add an optional free-text project/topic tag to tasks so employees can
-- group tasks by project without a separate projects table.
alter table tasks add column project text;
