-- Allow nullable user_id in group_members for placeholder members
ALTER TABLE public.group_members
ALTER COLUMN user_id DROP NOT NULL;

-- Update the unique constraint to allow multiple null user_ids for the same group
ALTER TABLE public.group_members
DROP CONSTRAINT group_members_group_id_user_id_key;

-- Create a partial unique index that only applies when user_id is not null
CREATE UNIQUE INDEX group_members_group_user_unique
ON public.group_members (group_id, user_id)
WHERE user_id IS NOT NULL;