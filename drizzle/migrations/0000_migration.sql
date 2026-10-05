
create type public.app_role as enum ('admin','user');
create type public.point_type as enum ('empresa','cooperativa','ecoponto','ponto_coleta');
create type public.point_status as enum ('pendente','aprovado','inativo');
create type public.point_pricing as enum ('gratuito','compra','cobra','nao_informado');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- first signed-in user may claim admin when no admin exists
create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.user_roles where role = 'admin') then return false; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(), 'admin');
  return true;
end $$;
grant execute on function public.claim_first_admin() to authenticated;

create table public.materials (
  id text primary key,
  name text not null,
  group_name text not null,
  sort_order int not null default 0
);
grant select on public.materials to anon, authenticated;
grant insert, update, delete on public.materials to authenticated;
grant all on public.materials to service_role;
alter table public.materials enable row level security;
create policy "materials public read" on public.materials for select using (true);
create policy "materials admin write" on public.materials for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.points (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type point_type not null,
  description text,
  image_url text,
  street text,
  number text,
  neighborhood text,
  city text not null default 'Itapetininga',
  state text not null default 'SP',
  cep text,
  lat double precision,
  lng double precision,
  phone text,
  whatsapp text,
  website text,
  email text,
  hours text,
  accepts_dropoff boolean not null default true,
  offers_pickup boolean not null default false,
  pricing point_pricing not null default 'nao_informado',
  cond_cleaning text,
  cond_packaging text,
  cond_min_quantity text,
  cond_costs text,
  cond_scheduling text,
  pricing_notes text,
  status point_status not null default 'pendente',
  is_demo boolean not null default false,
  submitter_name text,
  submitter_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.points to anon, authenticated;
grant insert, update, delete on public.points to authenticated;
grant all on public.points to service_role;
alter table public.points enable row level security;
create policy "points public approved" on public.points for select using (status = 'aprovado' or public.has_role(auth.uid(),'admin'));
create policy "points admin write" on public.points for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger points_touch before update on public.points for each row execute function public.touch_updated_at();

create table public.point_materials (
  point_id uuid not null references public.points(id) on delete cascade,
  material_id text not null references public.materials(id) on delete cascade,
  accepted boolean not null default true,
  primary key (point_id, material_id)
);
grant select on public.point_materials to anon, authenticated;
grant insert, update, delete on public.point_materials to authenticated;
grant all on public.point_materials to service_role;
alter table public.point_materials enable row level security;
create policy "pm public read" on public.point_materials for select using (
  exists (select 1 from public.points p where p.id = point_id and (p.status = 'aprovado' or public.has_role(auth.uid(),'admin')))
);
create policy "pm admin write" on public.point_materials for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.points(id) on delete cascade,
  message text not null check (char_length(message) between 5 and 1000),
  contact text check (contact is null or char_length(contact) <= 200),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
grant insert on public.reports to anon, authenticated;
grant select, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports anyone insert" on public.reports for insert to anon, authenticated with check (resolved = false);
create policy "reports admin" on public.reports for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- public submission: always pending
create or replace function public.submit_point(p jsonb, mats text[])
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; base text; s text; n int := 0;
begin
  if coalesce(trim(p->>'name'),'') = '' or char_length(p->>'name') > 150 then raise exception 'Nome inválido'; end if;
  base := lower(regexp_replace(translate(p->>'name','áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),'[^a-zA-Z0-9]+','-','g'));
  base := trim(both '-' from base);
  s := base;
  while exists (select 1 from points where slug = s) loop n := n + 1; s := base || '-' || n; end loop;
  insert into points(slug,name,type,description,street,number,neighborhood,city,state,cep,phone,whatsapp,website,email,hours,accepts_dropoff,offers_pickup,pricing,cond_cleaning,cond_packaging,cond_min_quantity,cond_costs,cond_scheduling,submitter_name,submitter_contact,status,is_demo)
  values (s, left(p->>'name',150), (p->>'type')::point_type, left(p->>'description',2000), left(p->>'street',200), left(p->>'number',20), left(p->>'neighborhood',120), coalesce(nullif(left(p->>'city',120),''),'Itapetininga'), 'SP', left(p->>'cep',10), left(p->>'phone',30), left(p->>'whatsapp',30), left(p->>'website',300), left(p->>'email',200), left(p->>'hours',500), coalesce((p->>'accepts_dropoff')::boolean,true), coalesce((p->>'offers_pickup')::boolean,false), coalesce((p->>'pricing')::point_pricing,'nao_informado'), left(p->>'cond_cleaning',500), left(p->>'cond_packaging',500), left(p->>'cond_min_quantity',200), left(p->>'cond_costs',500), left(p->>'cond_scheduling',500), left(p->>'submitter_name',150), left(p->>'submitter_contact',200), 'pendente', false)
  returning id into new_id;
  insert into point_materials(point_id, material_id, accepted)
    select new_id, m, true from unnest(mats) m where exists (select 1 from materials where id = m);
  return new_id;
end $$;
grant execute on function public.submit_point(jsonb, text[]) to anon, authenticated;

insert into public.materials(id,name,group_name,sort_order) values
('aluminio','Alumínio','Metais',1),('cobre','Cobre','Metais',2),('ferro','Ferro','Metais',3),('aco','Aço','Metais',4),('latao','Latão','Metais',5),('outros-metais','Outros metais','Metais',6),
('papel','Papel e papelão','Papel',10),
('pet','PET','Plásticos',20),('pead','PEAD','Plásticos',21),('pp','PP','Plásticos',22),('outros-plasticos','Outros plásticos','Plásticos',23),
('vidro','Vidro','Vidro',30),
('oleo','Óleo de cozinha usado','Óleo',40),
('computadores','Computadores','Eletrônicos',50),('celulares','Celulares','Eletrônicos',51),('cabos','Cabos','Eletrônicos',52),('eletrodomesticos','Pequenos eletrodomésticos','Eletrônicos',53),
('pilhas','Pilhas e baterias','Pilhas e baterias',60),
('lampadas','Lâmpadas','Lâmpadas',70),
('pneus','Pneus','Pneus',80),
('madeira','Madeira','Madeira',90),
('roupas','Roupas e tecidos','Roupas e tecidos',100),
('entulho','Entulho de construção','Entulho',110),
('organicos','Resíduos orgânicos','Orgânicos',120);

insert into public.points(slug,name,type,description,street,number,neighborhood,city,cep,lat,lng,hours,accepts_dropoff,offers_pickup,pricing,cond_cleaning,cond_packaging,status,is_demo) values
('demo-ecoponto-centro','Demonstração — Ecoponto Exemplo Centro','ecoponto','Demonstração — local fictício, criado apenas para mostrar o layout.','Rua Exemplo','100','Centro','Itapetininga','18200-000',-23.5917,-48.0531,'Seg a sex, 8h às 17h (fictício)',true,false,'gratuito','Materiais limpos e secos','Separe por tipo','aprovado',true),
('demo-cooperativa-vila','Demonstração — Cooperativa Exemplo Vila','cooperativa','Demonstração — local fictício, criado apenas para mostrar o layout.','Avenida Fictícia','250','Vila Exemplo','Itapetininga','18200-000',-23.6000,-48.0420,'Seg a sáb, 7h às 16h (fictício)',true,true,'compra','Sem restos de comida',null,'aprovado',true),
('demo-ponto-eletronicos','Demonstração — Ponto de Eletrônicos Exemplo','ponto_coleta','Demonstração — local fictício, criado apenas para mostrar o layout.','Rua Modelo','45','Jardim Exemplo','Itapetininga','18200-000',-23.5850,-48.0650,null,true,false,'nao_informado',null,'Pilhas em saco plástico fechado','aprovado',true);

insert into public.point_materials(point_id, material_id, accepted)
select p.id, m, true from public.points p, unnest(array['papel','pet','pead','vidro','aluminio','oleo']) m where p.slug='demo-ecoponto-centro'
union all select p.id, m, true from public.points p, unnest(array['papel','pet','pp','aluminio','cobre','ferro']) m where p.slug='demo-cooperativa-vila'
union all select p.id, 'vidro', false from public.points p where p.slug='demo-cooperativa-vila'
union all select p.id, m, true from public.points p, unnest(array['computadores','celulares','cabos','pilhas','lampadas']) m where p.slug='demo-ponto-eletronicos';
