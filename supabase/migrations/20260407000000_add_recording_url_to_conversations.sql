-- conversations に Twilio 録音 URL を保存
alter table public.conversations
  add column if not exists recording_url text;
