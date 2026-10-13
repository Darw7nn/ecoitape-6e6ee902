ALTER TABLE public.points ADD COLUMN IF NOT EXISTS cnpj text;
CREATE OR REPLACE FUNCTION public.submit_point(p jsonb, mats text[])
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare new_id uuid; base text; s text; n int := 0; doc text;
begin
  if coalesce(trim(p->>'name'),'') = '' or char_length(p->>'name') > 150 then raise exception 'Nome inválido'; end if;
  doc := nullif(regexp_replace(coalesce(p->>'cnpj',''),'\D','','g'),'');
  if doc is not null and char_length(doc) <> 14 then raise exception 'CNPJ inválido'; end if;
  base := lower(regexp_replace(translate(p->>'name','áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),'[^a-zA-Z0-9]+','-','g'));
  base := trim(both '-' from base);
  s := base;
  while exists (select 1 from points where slug = s) loop n := n + 1; s := base || '-' || n; end loop;
  insert into points(slug,name,type,description,street,number,neighborhood,city,state,cep,phone,whatsapp,website,email,hours,accepts_dropoff,offers_pickup,pricing,cond_cleaning,cond_packaging,cond_min_quantity,cond_costs,cond_scheduling,submitter_name,submitter_contact,status,is_demo,cnpj)
  values (s, left(p->>'name',150), (p->>'type')::point_type, left(p->>'description',2000), left(p->>'street',200), left(p->>'number',20), left(p->>'neighborhood',120), coalesce(nullif(left(p->>'city',120),''),'Itapetininga'), 'SP', left(p->>'cep',10), left(p->>'phone',30), left(p->>'whatsapp',30), left(p->>'website',300), left(p->>'email',200), left(p->>'hours',500), coalesce((p->>'accepts_dropoff')::boolean,true), coalesce((p->>'offers_pickup')::boolean,false), coalesce((p->>'pricing')::point_pricing,'nao_informado'), left(p->>'cond_cleaning',500), left(p->>'cond_packaging',500), left(p->>'cond_min_quantity',200), left(p->>'cond_costs',500), left(p->>'cond_scheduling',500), left(p->>'submitter_name',150), left(p->>'submitter_contact',200), 'pendente', false, doc)
  returning id into new_id;
  insert into point_materials(point_id, material_id, accepted)
    select new_id, m, true from unnest(mats) m where exists (select 1 from materials where id = m);
  return new_id;
end $function$;