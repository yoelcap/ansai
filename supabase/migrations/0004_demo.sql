-- ============================================================================
-- 0004_demo.sql — public demo account support
--
-- * businesses.is_demo flags the single shared demo business. The app uses it
--   for the in-app banner and the demo restrictions, and reset_demo_data()
--   refuses to touch any business that is not flagged.
-- * reset_demo_data(business_id) wipes and re-creates the demo content
--   (40 reviews over the last 12 months, responses, tone config). Dates are
--   relative to now(), so a weekly reset keeps the dashboard looking current.
--   Used by supabase/seed.sql (local) and scripts/reset-demo.ts (production).
-- ============================================================================

alter table public.businesses add column if not exists is_demo boolean not null default false;

-- At most one demo business.
create unique index if not exists businesses_single_demo on public.businesses (is_demo) where is_demo;

create or replace function public.reset_demo_data(p_business_id uuid)
returns void
language plpgsql
set search_path = ''
as $fn$
declare
  v_owner uuid;
begin
  select user_id into v_owner
  from public.businesses
  where id = p_business_id and is_demo;

  if v_owner is null then
    raise exception 'reset_demo_data: business % is not the demo business', p_business_id;
  end if;

  -- Restore anything a visitor may have edited.
  update public.businesses set
    name = 'Taberna El Faro', type = 'restaurant', city = 'Mechelen', country = 'BE',
    address = 'Voorbeeldstraat 12, 2800 Mechelen', phone = null,
    email = null, website = null
  where id = p_business_id;

  update public.profiles set
    full_name = 'Demo', onboarded = true, current_business_id = p_business_id
  where id = v_owner;

  delete from public.team_members where business_id = p_business_id;
  delete from public.integrations where business_id = p_business_id;
  delete from public.reviews where business_id = p_business_id; -- cascades to responses

  insert into public.tone_configs
    (business_id, formality, response_length, response_language, signature, forbidden_phrases, favorite_phrases)
  values
    (p_business_id, 'informal', 'medium', 'auto', 'Taberna El Faro',
     array['Estimado cliente', 'Dear valued customer'], array['¡Te esperamos pronto!'])
  on conflict (business_id) do update set
    formality = excluded.formality,
    response_length = excluded.response_length,
    response_language = excluded.response_language,
    signature = excluded.signature,
    forbidden_phrases = excluded.forbidden_phrases,
    favorite_phrases = excluded.favorite_phrases;

  create temporary table demo_seed (
    days_ago        numeric,
    customer_name   text,
    rating          int,
    language        text,
    review_status   text,
    review_text     text,
    response_text   text,
    response_status text,
    edited_text     text,
    response_hours  numeric
  ) on commit drop;

  insert into demo_seed values
  -- ── Pending: AI reply generated, waiting for the owner ─────────────────────
  (0.2, 'Sophie V.', 5, 'nl', 'pending',
   $t$Fantastische avond gehad! De gegrilde octopus was perfect en de bediening was super vriendelijk. We komen zeker terug.$t$,
   $t$Dankjewel Sophie! Wat fijn dat de gegrilde octopus zo in de smaak viel, daar zijn we in de keuken best trots op. Je complimenten voor de bediening geven we graag door. Tot de volgende keer!$t$,
   'generated', null, null),
  (1.1, 'Marco R.', 2, 'en', 'pending',
   $t$The food was decent, but we waited almost 50 minutes for our mains on a quiet Tuesday and nobody came to explain the delay. Disappointing for the price.$t$,
   $t$Marco, thank you for telling us, and we're sorry. Waiting 50 minutes for your mains without anyone explaining why isn't acceptable, especially on a quiet evening. We've talked it through with the team so that delays are explained at the table straight away.$t$,
   'generated', null, null),
  (2.3, 'Lucía P.', 4, 'es', 'pending',
   $t$Las croquetas de jamón, de lo mejor que he probado en Bélgica. Le quito una estrella porque la música estaba demasiado alta y costaba hablar.$t$,
   $t$¡Gracias, Lucía! Nos hace mucha ilusión que las croquetas te supieran a casa. Tienes razón con la música, aquí se viene a charlar y la tendremos más baja. ¡Te esperamos pronto!$t$,
   'generated', null, null),
  (3.4, 'Thomas D.', 1, 'fr', 'pending',
   $t$Très déçu. Notre réservation n'avait pas été enregistrée et on nous a installés près de la porte des cuisines. Le vin était tiède.$t$,
   $t$Thomas, nous sommes sincèrement désolés. Une réservation perdue, une table près des cuisines et un vin servi tiède : ce n'est pas l'accueil que vous méritiez. Merci de nous l'avoir signalé, nous revoyons notre façon de gérer les réservations.$t$,
   'generated', null, null),
  (5.2, 'Anna K.', 5, 'de', 'pending',
   $t$Wunderbare Tapas und eine sehr herzliche Atmosphäre. Der Kellner hat uns tolle Weinempfehlungen gegeben. Absolut empfehlenswert!$t$,
   $t$Vielen Dank, Anna! Es freut uns sehr, dass dir die Tapas und die Weinempfehlungen gefallen haben. Wir geben das Lob gern an unser Team weiter. Bis bald!$t$,
   'edited',
   $t$Vielen Dank, Anna! Schön, dass dir die Tapas und die herzliche Atmosphäre gefallen haben. Wir sagen Jonas, dass seine Weinempfehlungen so gut ankamen, er wird sich freuen. Bis bald in der Taberna!$t$,
   null),
  (8.0, 'Jan P.', 3, 'nl', 'pending',
   $t$Lekker gegeten, maar de porties waren aan de kleine kant voor de prijs. De patatas bravas waren wel top.$t$,
   $t$Bedankt voor je eerlijke feedback, Jan! Fijn dat de patatas bravas je bevielen. Je opmerking over de porties nemen we mee als we de kaart herbekijken. Hopelijk tot snel!$t$,
   'generated', null, null),
  (11.5, 'Emma L.', 5, 'en', 'pending',
   $t$Booked for my mum's birthday and the staff surprised her with a candle on the crema catalana. Such a lovely touch, thank you!$t$,
   $t$Thank you, Emma! We're so glad your mum had a lovely birthday with us. Please wish her many happy returns from all of us!$t$,
   'generated', null, null),

  -- ── Rejected: the owner chose not to reply ─────────────────────────────────
  (20.0, 'Kevin B.', 1, 'nl', 'rejected',
   $t$Slechtste restaurant ooit!!!$t$,
   $t$Het spijt ons dat je zo'n slechte ervaring had, Kevin. We horen graag wat er misging, zodat we het kunnen verbeteren.$t$,
   'rejected', null, null),
  (140.0, 'Dirk S.', 2, 'nl', 'rejected',
   $t$Eten was oké, maar parkeren in de buurt is echt een ramp.$t$,
   $t$Bedankt voor je feedback, Dirk. We begrijpen dat parkeren in de buurt lastig kan zijn en hopen dat het eten de moeite waard was.$t$,
   'rejected', null, null),

  -- ── Approved: answered by the owner ────────────────────────────────────────
  (15.0, 'Pieter V.', 5, 'nl', 'approved',
   $t$Al jaren onze vaste stek voor een vrijdagavond. De gambas al ajillo blijven onovertroffen.$t$,
   $t$Wat leuk om te lezen, Pieter! Vaste gasten zoals jullie maken onze vrijdagen. De gambas al ajillo blijven gelukkig op de kaart. Tot vrijdag!$t$,
   'approved', null, 5),
  (18.0, 'Claire M.', 4, 'fr', 'approved',
   $t$Cuisine savoureuse et service attentionné. Seul bémol, il faisait un peu froid près de la fenêtre.$t$,
   $t$Merci beaucoup, Claire ! Ravis que la cuisine et le service vous aient plu. Merci aussi pour la remarque sur la fenêtre, nous allons y remédier. À bientôt !$t$,
   'approved', null, 9),
  (25.0, 'Daniel H.', 5, 'en', 'approved',
   $t$Best tapas in Mechelen, hands down. The tortilla was perfectly runny in the middle and the sangria wasn't too sweet.$t$,
   $t$Thanks a lot, Daniel! A runny tortilla is a point of honour for our kitchen, so that made our day. Glad the sangria hit the spot too. See you soon!$t$,
   'approved', null, 3),
  (28.0, 'Elena G.', 5, 'es', 'approved',
   $t$Fuimos un grupo de ocho y nos atendieron de maravilla. El pulpo a la gallega, espectacular.$t$,
   $t$¡Muchas gracias, Elena! Qué alegría que el grupo saliera contento y que el pulpo estuviera a la altura. ¡Volved cuando queráis!$t$,
   'approved', null, 14),
  (33.0, 'Lotte J.', 4, 'nl', 'approved',
   $t$Gezellige sfeer en lekkere tapas. Het was wel heel druk, waardoor het even duurde voor we konden bestellen.$t$,
   $t$Dankjewel, Lotte! Fijn dat je genoten hebt van de sfeer en de tapas. Sorry dat je even moest wachten om te bestellen, dat nemen we mee.$t$,
   'approved', null, 7),
  (38.0, 'Markus W.', 5, 'de', 'approved',
   $t$Wie ein kleiner Urlaub in Spanien! Die Paella war hervorragend und der Service sehr aufmerksam.$t$,
   $t$Vielen Dank, Markus! Ein kleiner Urlaub in Spanien, schöner kann man es kaum sagen. Freut uns, dass dir die Paella geschmeckt hat. Bis zum nächsten Mal!$t$,
   'approved', null, 20),
  (45.0, 'Sarah T.', 4, 'en', 'approved',
   $t$Lovely evening and a great wine list. The churros were a little greasy, but everything else was spot on.$t$,
   $t$Thanks, Sarah! Glad you enjoyed the evening and the wine list. And thank you for the honest note on the churros, we've passed it on to the kitchen.$t$,
   'approved', null, 7),
  (52.0, 'Wout D.', 5, 'nl', 'approved',
   $t$Top bediening, heerlijk eten en een fijne prijs-kwaliteitverhouding. Aanrader!$t$,
   $t$Merci, Wout! Zo'n review doet ons hele team plezier. Tot een volgende keer!$t$,
   'approved', null, 4),
  (58.0, 'Julie R.', 3, 'fr', 'approved',
   $t$Les tapas étaient bonnes, mais l'attente entre les plats était longue et la salle très bruyante.$t$,
   $t$Merci pour votre retour, Julie. Contents que les tapas vous aient plu, et désolés pour l'attente entre les plats et le bruit. Nous en avons parlé avec l'équipe.$t$,
   'approved', null, 26),
  (66.0, 'Hanna B.', 5, 'de', 'approved',
   $t$Super freundliches Personal und die besten Patatas Bravas, die ich je gegessen habe.$t$,
   $t$Danke, Hanna! Die besten Patatas Bravas, das hören wir gern. Wir richten dem Team dein Lob aus. Bis bald!$t$,
   'approved', null, 11),
  (75.0, 'Bram C.', 4, 'nl', 'approved',
   $t$Lekkere sangria en goede tapas. De wijnkaart mocht iets uitgebreider.$t$,
   $t$Bedankt, Bram! Fijn dat de sangria en de tapas smaakten. Goede tip over de wijnkaart, daar gaan we naar kijken.$t$,
   'approved', null, 6),
  (84.0, 'Oliver S.', 5, 'en', 'approved',
   $t$Came in on a rainy Sunday and left feeling like I'd been to Seville. Warm welcome, great food.$t$,
   $t$What a lovely thing to say, Oliver, thank you! A bit of Seville on a rainy Sunday is exactly what we're going for. Hope to see you again soon.$t$,
   'approved', null, 2),
  (95.0, 'Carmen L.', 4, 'es', 'approved',
   $t$Muy buena comida casera, como en casa. El postre podría mejorar, pero volveremos.$t$,
   $t$¡Gracias, Carmen! Que la comida te recuerde a casa es el mejor cumplido. Tomamos nota de lo del postre. ¡Hasta pronto!$t$,
   'approved', null, 18),
  (108.0, 'Nathalie F.', 5, 'fr', 'approved',
   $t$Une adresse que je recommande les yeux fermés. Produits frais, accueil chaleureux.$t$,
   $t$Merci infiniment, Nathalie ! Votre recommandation nous touche beaucoup. À très bientôt à la Taberna !$t$,
   'approved', null, 9),
  (120.0, 'Ruben M.', 5, 'nl', 'approved',
   $t$Ons verjaardagsdiner was perfect. Het personeel dacht overal aan.$t$,
   $t$Wat fijn, Ruben! Bedankt dat jullie je verjaardag bij ons kwamen vieren. Tot de volgende keer!$t$,
   'approved', null, 13),
  (133.0, 'James W.', 3, 'en', 'approved',
   $t$Good food but overpriced. Nine euros for three croquetas feels steep.$t$,
   $t$Thanks for the feedback, James. Glad you enjoyed the food, and we hear you on the price of the croquetas. We'll take it into account when we review the menu.$t$,
   'approved', null, 30),
  (150.0, 'Ines V.', 2, 'nl', 'approved',
   $t$Lang moeten wachten op een tafel ondanks reservatie, en daarna nog eens op het eten. Jammer, want vroeger was het hier beter.$t$,
   $t$Ines, het spijt ons echt. Ondanks je reservatie moeten wachten op een tafel en daarna nog op het eten, dat had niet mogen gebeuren. Bedankt dat je het ons laat weten.$t$,
   'approved',
   $t$Ines, het spijt ons echt. Ondanks je reservatie moeten wachten op een tafel en daarna nog op het eten, dat had niet mogen gebeuren. Bedankt dat je het ons laat weten. Hopelijk geef je ons nog een kans.$t$,
   22),
  (158.0, 'Antoine B.', 3, 'fr', 'approved',
   $t$Correct sans plus. Le service était débordé ce soir-là.$t$,
   $t$Merci pour votre avis, Antoine. Désolés que le service ait été débordé ce soir-là. Nous espérons vous offrir une meilleure expérience la prochaine fois.$t$,
   'approved', null, 28),
  (166.0, 'Tom K.', 2, 'en', 'approved',
   $t$Our order was mixed up twice and the paella arrived lukewarm. The staff were apologetic, but it spoiled the evening.$t$,
   $t$Tom, we're really sorry. Getting your order wrong twice and serving the paella lukewarm spoiled what should have been a good evening. Thank you for being patient with the team, and for letting us know.$t$,
   'approved', null, 16),
  (175.0, 'Fleur A.', 3, 'nl', 'approved',
   $t$Gezellig terras, maar het eten was deze keer minder dan gewoonlijk.$t$,
   $t$Bedankt voor je eerlijke review, Fleur. Fijn dat je het terras gezellig vond, en jammer dat het eten deze keer minder was. We geven het door aan de keuken.$t$,
   'approved', null, 20),
  (190.0, 'Javier S.', 4, 'es', 'approved',
   $t$Buen ambiente y buena relación calidad-precio. La tortilla, muy rica.$t$,
   $t$¡Gracias, Javier! Nos alegra que te gustaran el ambiente y la tortilla. ¡Te esperamos pronto!$t$,
   'approved', null, 8),
  (205.0, 'Katrin M.', 5, 'de', 'approved',
   $t$Ein echtes Highlight in Mechelen. Tolle Auswahl an spanischen Weinen und hervorragende Tapas.$t$,
   $t$Vielen Dank, Katrin! Schön, dass du unsere spanischen Weine und Tapas genossen hast. Bis bald!$t$,
   'approved', null, 10),
  (220.0, 'Elise P.', 5, 'fr', 'approved',
   $t$Soirée parfaite entre amies. Les tapas sont délicieuses et le personnel adorable.$t$,
   $t$Merci beaucoup, Elise ! Ravis que votre soirée entre amies ait été réussie. À bientôt !$t$,
   'approved', null, 5),
  (238.0, 'Stijn L.', 4, 'nl', 'approved',
   $t$Goede tapas, vriendelijke bediening. Iets te warm binnen in de zomer.$t$,
   $t$Dankjewel, Stijn! Fijn dat je tevreden was over de tapas en de bediening. Goede opmerking over de temperatuur, die nemen we mee.$t$,
   'approved', null, 12),
  (255.0, 'Rachel G.', 5, 'en', 'approved',
   $t$Fantastic vegetarian options, which is rare for a tapas bar. The grilled vegetables with romesco were amazing.$t$,
   $t$Thanks so much, Rachel! We're really glad our vegetarian dishes stood out, and the romesco is a house favourite. See you soon!$t$,
   'approved', null, 6),
  (270.0, 'Pablo N.', 5, 'es', 'approved',
   $t$Por fin un sitio en Mechelen con jamón de verdad. Trato excelente.$t$,
   $t$¡Mil gracias, Pablo! Que nos digas eso del jamón nos llena de orgullo. ¡Aquí tienes tu casa!$t$,
   'approved', null, 3),
  (288.0, 'Greet H.', 4, 'nl', 'approved',
   $t$Lekker en gezellig. De bediening was soms wat traag.$t$,
   $t$Bedankt, Greet! Fijn dat je het lekker en gezellig vond. Sorry voor de soms trage bediening, we werken eraan.$t$,
   'approved', null, 15),
  (305.0, 'Lukas F.', 4, 'de', 'approved',
   $t$Sehr gutes Essen, etwas laut, aber insgesamt ein schöner Abend.$t$,
   $t$Danke, Lukas! Freut uns, dass dir das Essen geschmeckt hat und der Abend schön war. Den Hinweis zur Lautstärke nehmen wir mit.$t$,
   'approved', null, 19),
  (322.0, 'Camille D.', 5, 'fr', 'approved',
   $t$Un vrai coup de cœur ! On s'y sent comme en Espagne.$t$,
   $t$Merci, Camille ! Vous sentir comme en Espagne, c'est exactement ce que nous voulions. À très vite !$t$,
   'approved', null, 7),
  (340.0, 'Álvaro V.', 4, 'es', 'approved',
   $t$Muy buenas tapas y camareros simpáticos. Algo caro, pero merece la pena.$t$,
   $t$¡Gracias, Álvaro! Nos alegra que disfrutaras de las tapas y del equipo. ¡Te esperamos pronto!$t$,
   'approved', null, 11),
  (355.0, 'Michael O.', 5, 'en', 'approved',
   $t$Hidden gem! Fantastic food, great atmosphere and genuinely friendly staff.$t$,
   $t$Thank you, Michael! So glad you enjoyed the food and the atmosphere. Hope to welcome you back soon!$t$,
   'approved', null, 4);

  with inserted as (
    insert into public.reviews
      (business_id, customer_name, rating, text, language, source, review_date, status, created_at)
    select
      p_business_id, s.customer_name, s.rating, s.review_text, s.language, 'google',
      now() - make_interval(secs => s.days_ago * 86400),
      s.review_status,
      now() - make_interval(secs => s.days_ago * 86400)
    from demo_seed s
    returning id, customer_name, review_date
  )
  insert into public.responses
    (review_id, text, status, model_used, tokens_input, tokens_output, edited_text, created_at, approved_at)
  select
    i.id,
    s.response_text || E'\n\nTaberna El Faro',
    s.response_status,
    -- Same rule as the generate endpoint: complex reviews go to the larger model.
    case when s.rating <= 2 or length(s.review_text) > 400 then 'claude-opus-4-7' else 'claude-haiku-4-5' end,
    900 + length(s.review_text) / 4,
    length(s.response_text) / 4,
    case when s.edited_text is not null then s.edited_text || E'\n\nTaberna El Faro' end,
    i.review_date + interval '2 minutes',
    case when s.response_hours is not null
         then i.review_date + make_interval(secs => s.response_hours * 3600) end
  from inserted i
  join demo_seed s on s.customer_name = i.customer_name;
end;
$fn$;

-- Only the service role (scripts/reset-demo.ts) and the database owner (seed)
-- may run it; never exposed to browser roles.
revoke execute on function public.reset_demo_data(uuid) from public, anon, authenticated;
grant execute on function public.reset_demo_data(uuid) to service_role;
