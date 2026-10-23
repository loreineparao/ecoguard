create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  role text not null default 'resident' check (role in ('resident', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'resident'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when excluded.full_name = '' then public.profiles.full_name
          else excluded.full_name
        end;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  description text not null,
  status text not null default 'Pending'
    check (status in ('Pending', 'Under Review', 'Dispatched', 'Resolved')),
  assigned_personnel text,
  created_at timestamptz not null default now()
);

create index complaints_created_at_idx on public.complaints (created_at desc);
create index complaints_user_id_created_at_idx on public.complaints (user_id, created_at desc);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text,
  created_at timestamptz not null default now()
);

create index locations_complaint_id_idx on public.locations (complaint_id);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create index evidence_complaint_id_uploaded_at_idx
  on public.evidence (complaint_id, uploaded_at desc);

create table public.permit_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  applicant_name text not null,
  documentary_requirements jsonb not null default '{}'::jsonb,
  application_status text not null default 'Pending'
    check (application_status in ('Pending', 'Under Review', 'Approved', 'Rejected')),
  submitted_at timestamptz not null default now()
);

create index permit_applications_submitted_at_idx
  on public.permit_applications (submitted_at desc);
create index permit_applications_user_id_submitted_at_idx
  on public.permit_applications (user_id, submitted_at desc);

create table public.permit_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.permit_applications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  content_type text not null,
  uploaded_at timestamptz not null default now()
);

create index permit_documents_application_id_idx on public.permit_documents (application_id);

create table public.collection_schedules (
  id uuid primary key default gen_random_uuid(),
  barangay text not null,
  collection_time text not null,
  truck_id text,
  driver_id text,
  created_at timestamptz not null default now()
);

create index collection_schedules_time_idx on public.collection_schedules (collection_time);

create table public.trip_tickets (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.collection_schedules(id) on delete restrict,
  estimated_load text,
  actual_collection_time text,
  driver_name text not null,
  plate_number text not null,
  created_at timestamptz not null default now()
);

create index trip_tickets_created_at_idx on public.trip_tickets (created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  generated_at timestamptz not null default now(),
  generated_by uuid not null references public.profiles(id) on delete restrict
);

create index reports_generated_at_idx on public.reports (generated_at desc);

alter table public.profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.locations enable row level security;
alter table public.evidence enable row level security;
alter table public.permit_applications enable row level security;
alter table public.permit_documents enable row level security;
alter table public.collection_schedules enable row level security;
alter table public.trip_tickets enable row level security;
alter table public.reports enable row level security;

create policy "Users can read own profile; admins can read all profiles"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Residents can create complaints"
  on public.complaints for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Residents can read own complaints; admins can read all"
  on public.complaints for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins can update complaints"
  on public.complaints for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Owners and admins can read complaint locations"
  on public.locations for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.complaints c
      where c.id = complaint_id and c.user_id = (select auth.uid())
    )
  );

create policy "Complaint owners can add locations"
  on public.locations for insert to authenticated
  with check (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_id and c.user_id = (select auth.uid())
    )
  );

create policy "Owners and admins can read complaint evidence"
  on public.evidence for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.complaints c
      where c.id = complaint_id and c.user_id = (select auth.uid())
    )
  );

create policy "Complaint owners can add evidence"
  on public.evidence for insert to authenticated
  with check (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_id and c.user_id = (select auth.uid())
    )
  );

create policy "Residents can create permit applications"
  on public.permit_applications for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Owners and admins can read permit applications"
  on public.permit_applications for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins can update permit applications"
  on public.permit_applications for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Owners and admins can read permit documents"
  on public.permit_documents for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Residents can add documents to own applications"
  on public.permit_documents for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.permit_applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
  );

create policy "Authenticated users can read collection schedules"
  on public.collection_schedules for select to authenticated
  using (true);

create policy "Admins can manage collection schedules"
  on public.collection_schedules for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can manage trip tickets"
  on public.trip_tickets for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can manage reports"
  on public.reports for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('complaint-evidence', 'complaint-evidence', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('permit-documents', 'permit-documents', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload complaint evidence to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'complaint-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners and admins can read complaint evidence files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'complaint-evidence'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );

create policy "Users can upload permit documents to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'permit-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners and admins can read permit documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'permit-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );

create policy "Users can delete their own uploaded files"
  on storage.objects for delete to authenticated
  using (
    (bucket_id = 'complaint-evidence' or bucket_id = 'permit-documents')
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update on public.complaints to authenticated;
grant select, insert on public.locations to authenticated;
grant select, insert on public.evidence to authenticated;
grant select, insert, update on public.permit_applications to authenticated;
grant select, insert on public.permit_documents to authenticated;
grant insert, select, update, delete on public.collection_schedules to authenticated;
grant select, insert, update, delete on public.trip_tickets to authenticated;
grant select, insert, update, delete on public.reports to authenticated;
grant execute on function public.is_admin() to authenticated;
