-- Messages table for appointment-based chat
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.schedules(id) on delete cascade,
  -- sender/receiver refer to user_profiles.id (same as auth.uid())
  sender_id uuid not null references public.user_profiles(id) on delete cascade,
  receiver_id uuid not null references public.user_profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- Allow participants (doctor or patient on the schedule) to read their appointment messages
drop policy if exists "read_messages_participants" on public.messages;
create policy "read_messages_participants"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.schedules s
      join public.doctor_profiles dp on dp.id = s.doctor_id
      join public.patient_profiles pp on pp.id = s.patient_id
      where s.id = messages.appointment_id
        and (dp.user_profile_id = auth.uid() or pp.user_profile_id = auth.uid())
    )
  );

-- Allow participants to send messages for their appointment
drop policy if exists "insert_messages_participants" on public.messages;
create policy "insert_messages_participants"
  on public.messages
  for insert
  with check (
    exists (
      select 1
      from public.schedules s
      join public.doctor_profiles dp on dp.id = s.doctor_id
      join public.patient_profiles pp on pp.id = s.patient_id
      where s.id = appointment_id
        and (auth.uid() = dp.user_profile_id or auth.uid() = pp.user_profile_id)
        and sender_id = auth.uid()
    )
  );

-- Optional: Indexes for performance
create index if not exists idx_messages_appointment_created_at on public.messages(appointment_id, created_at);
