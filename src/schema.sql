-- १. जुने टेबल्स साफ करा (Clean start साठी)
drop table if exists attendance cascade;
drop table if exists assignments cascade;
drop table if exists subjects cascade;
drop table if exists faculties cascade;

-- २. Faculties Table (शिक्षकांची माहिती)
create table faculties (
  id text primary key, -- Faculty ID (उदा. FAC001)
  name text not null,
  password text not null,
  created_at timestamp with time zone default now()
);

-- ३. Subjects Table (एक्सेल मधील क्लास आणि विषयांची लिंक)
create table subjects (
  id uuid primary key default gen_random_uuid(),
  class_name text not null, -- उदा. COM4, COM6
  subject_name text not null, -- उदा. Java, Python
  created_at timestamp with time zone default now()
);

-- ४. Assignments Table (कोणता शिक्षक कोणता विषय शिकवणार)
create table assignments (
  id uuid primary key default gen_random_uuid(),
  fac_id text references faculties(id) on delete cascade,
  fac_name text not null,
  class_name text not null,
  subject_name text not null,
  created_at timestamp with time zone default now()
);

-- ५. Attendance Table (हजेरीचा मुख्य डेटा)
create table attendance (
  id uuid primary key default gen_random_uuid(),
  faculty text not null,
  class text not null,
  sub text not null,
  present int not null,
  total int not null,
  time_str text not null, -- तारीख आणि वेळ (String फॉरमॅटमध्ये)
  created_at timestamp with time zone default now()
);

-- ६. Row Level Security (RLS) Enable करा
alter table faculties enable row level security;
alter table subjects enable row level security;
alter table assignments enable row level security;
alter table attendance enable row level security;

-- ७. Policies तयार करा (जेणेकरून App मधून डेटा वाचता आणि लिहिता येईल)
create policy "Public Access Faculties" on faculties for all using (true) with check (true);
create policy "Public Access Subjects" on subjects for all using (true) with check (true);
create policy "Public Access Assignments" on assignments for all using (true) with check (true);
create policy "Public Access Attendance" on attendance for all using (true) with check (true);