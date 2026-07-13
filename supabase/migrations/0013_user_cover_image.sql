-- Custom profile cover photo (public profile hero). Avatar reuses users.image.
alter table users add column if not exists cover_image text;
