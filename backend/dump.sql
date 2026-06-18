--
-- PostgreSQL database dump
--

\restrict Gray1q5fVwgnwGcTEDGt0nEGJsdaKv0IWXQssfsAZcMz1tRzEBoNc5llq5uZBCL

-- Dumped from database version 16.14 (daf32eb)
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.shifts DROP CONSTRAINT "shifts_employeeId_fkey";
ALTER TABLE ONLY public.shifts DROP CONSTRAINT "shifts_createdById_fkey";
ALTER TABLE ONLY public.news DROP CONSTRAINT "news_authorId_fkey";
ALTER TABLE ONLY public.knowledge_materials DROP CONSTRAINT "knowledge_materials_authorId_fkey";
ALTER TABLE ONLY public.feedbacks DROP CONSTRAINT "feedbacks_authorId_fkey";
ALTER TABLE ONLY public.feedback_comments DROP CONSTRAINT "feedback_comments_feedbackId_fkey";
ALTER TABLE ONLY public.feedback_comments DROP CONSTRAINT "feedback_comments_authorId_fkey";
DROP INDEX public.users_email_key;
DROP INDEX public."PageContent_pageName_key";
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.shifts DROP CONSTRAINT shifts_pkey;
ALTER TABLE ONLY public.news DROP CONSTRAINT news_pkey;
ALTER TABLE ONLY public.knowledge_materials DROP CONSTRAINT knowledge_materials_pkey;
ALTER TABLE ONLY public.feedbacks DROP CONSTRAINT feedbacks_pkey;
ALTER TABLE ONLY public.feedback_comments DROP CONSTRAINT feedback_comments_pkey;
ALTER TABLE ONLY public._prisma_migrations DROP CONSTRAINT _prisma_migrations_pkey;
ALTER TABLE ONLY public."PageContent" DROP CONSTRAINT "PageContent_pkey";
DROP TABLE public.users;
DROP TABLE public.shifts;
DROP TABLE public.news;
DROP TABLE public.knowledge_materials;
DROP TABLE public.feedbacks;
DROP TABLE public.feedback_comments;
DROP TABLE public._prisma_migrations;
DROP TABLE public."PageContent";
DROP TYPE public."ShiftStatus";
DROP TYPE public."Role";
DROP TYPE public."KnowledgeCategory";
DROP TYPE public."FeedbackType";
DROP TYPE public."FeedbackStatus";
DROP TYPE public."FeedbackPriority";
DROP SCHEMA public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: FeedbackPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FeedbackPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


--
-- Name: FeedbackStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FeedbackStatus" AS ENUM (
    'NEW',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


--
-- Name: FeedbackType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FeedbackType" AS ENUM (
    'SUGGESTION',
    'GRATITUDE',
    'PROBLEM'
);


--
-- Name: KnowledgeCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KnowledgeCategory" AS ENUM (
    'IT',
    'HR',
    'POLICIES',
    'FAQ'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'EMPLOYEE',
    'MANAGER',
    'ADMIN',
    'CHEF',
    'SUPER_ADMIN'
);


--
-- Name: ShiftStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShiftStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'MISSED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: PageContent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PageContent" (
    id text NOT NULL,
    "pageName" text NOT NULL,
    content text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: feedback_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_comments (
    id text NOT NULL,
    content text NOT NULL,
    "feedbackId" text NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedbacks (
    id text NOT NULL,
    type public."FeedbackType" NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    priority public."FeedbackPriority" DEFAULT 'MEDIUM'::public."FeedbackPriority" NOT NULL,
    status public."FeedbackStatus" DEFAULT 'NEW'::public."FeedbackStatus" NOT NULL,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    "authorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: knowledge_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_materials (
    id text NOT NULL,
    title text NOT NULL,
    category public."KnowledgeCategory" NOT NULL,
    content text,
    "pdfUrl" text,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "imageUrl" text,
    "publishedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shifts (
    id text NOT NULL,
    department text NOT NULL,
    date date NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "employeeId" text NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actualEndTime" timestamp(3) without time zone,
    "actualStartTime" timestamp(3) without time zone,
    "isLookingForSwap" boolean DEFAULT false NOT NULL,
    status public."ShiftStatus" DEFAULT 'SCHEDULED'::public."ShiftStatus" NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "fullName" text NOT NULL,
    department text,
    "position" text,
    phone text,
    role public."Role" DEFAULT 'EMPLOYEE'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "avatarUrl" text,
    "hourlyRate" double precision DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Data for Name: PageContent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PageContent" (id, "pageName", content, "updatedAt") FROM stdin;
8080ff66-a5d4-4a24-8e9e-b03ea9871db5	feedback	[]	2026-06-17 08:25:30.503
a36fcf80-8ee8-42ab-a8f9-b1ea82abc899	home	{"title":"Добро пожаловать в Две Березки!","subtitle":"Портал для сотрудников","welcomeText":"<p>Здесь&nbsp;вы&nbsp;найдете&nbsp;всю&nbsp;необходимую&nbsp;информацию&nbsp;для&nbsp;комфортной&nbsp;работы.</p>","memos":[{"id":"1774669324575","title":"Правила дресс-кода","content":"Белый верх, черный низ"},{"id":"1774669750839","title":"Курение","content":"Курить в специально отведенных местах"}],"links":[{"id":"1776161097164","title":"База знаний","url":"http://localhost:5173/knowledge","icon":"📁","colorClass":"bg-orange-50 text-orange-500"},{"id":"1776161142374","title":"Меню ресторана","url":"http://localhost:5173/menu","icon":"🍽️","colorClass":"bg-green-50 text-green-500"},{"id":"1776161259882","title":"Инструкции по ТБ","url":"http://localhost:5173/safety","icon":"📋","colorClass":"bg-blue-50 text-blue-500"},{"id":"1776161353400","title":"Наш сайт","url":"https://2berezki.ru/","icon":"🎄","colorClass":"bg-purple-50 text-purple-500"}],"management":[{"id":"1775206244777","userId":"42af6dc6-f036-442d-8aca-1de7989f2542","fullName":"Петр Смирнов","position":"Администратор","avatarUrl":"/uploads/avatar-1774512836832-750228934.jpg"},{"id":"1775212174224","userId":"cbaaf155-4ec1-412b-a714-ef19bbee0fe7","fullName":"Иван Иванов","position":"Администратор","avatarUrl":null},{"id":"1775557644916","userId":"0600c0f2-b152-4434-97ab-2020347701f3","fullName":"Илья Неретин","position":"Гл. Админимтратор","avatarUrl":"/uploads/avatar-1775556673913-440947263.jpg"}],"menuPresets":[{"id":"default","name":"Основное меню","menu":[{"day":"Понедельник","breakfast":"Омлет с сыром","lunch":"Борщ, пюре с котлетой","dinner":"Рыба на пару, рис"},{"day":"Вторник","breakfast":"Яичница с овощами","lunch":"Уха, макароны с сосиской","dinner":"Картофель в мундире с мясом"},{"day":"Среда","breakfast":" Глазунья с беконом, свежевыжатый сок.","lunch":"Грибной суп, плов с бараниной.","dinner":"Паста с морепродуктами, хлеб с чесноком."},{"day":"Четверг","breakfast":"Смузи-боул, круассан.","lunch":"Рассольник, бефстроганов с рисом.","dinner":"Стейк из говядины, запеченные овощи."},{"day":"Пятница","breakfast":"Творожная запеканка, йогурт.","lunch":"Уха, жульен с курицей","dinner":"Ризотто с грибами, овощи гриль."},{"day":"Суббота","breakfast":"Блинчики","lunch":"Домашний куриный суп с лапшой, голубцы.","dinner":"Пицца Маргарита, салат Цезарь."},{"day":"Воскресенье","breakfast":"Яичница-болтунья с лососем, авокадо.","lunch":"Жаркое по-домашнему, винегрет.","dinner":"Утиная ножка конфи, картофель дофинуа."}]},{"id":"1778975315676","name":"Меню 2","menu":[{"day":"Понедельник","breakfast":"","lunch":"","dinner":""},{"day":"Вторник","breakfast":"","lunch":"","dinner":""},{"day":"Среда","breakfast":"","lunch":"","dinner":""},{"day":"Четверг","breakfast":"","lunch":"","dinner":""},{"day":"Пятница","breakfast":"","lunch":"","dinner":""},{"day":"Суббота","breakfast":"","lunch":"","dinner":""},{"day":"Воскресенье","breakfast":"","lunch":"","dinner":""}]},{"id":"1781608933775","name":"Меню 3","menu":[{"day":"Понедельник","breakfast":"fdgfdg","lunch":"fdgfdg","dinner":"fdgfdg"},{"day":"Вторник","breakfast":"dfgd","lunch":"dfg","dinner":"dfg"},{"day":"Среда","breakfast":"","lunch":"","dinner":""},{"day":"Четверг","breakfast":"","lunch":"","dinner":""},{"day":"Пятница","breakfast":"","lunch":"","dinner":""},{"day":"Суббота","breakfast":"","lunch":"","dinner":""},{"day":"Воскресенье","breakfast":"","lunch":"","dinner":""}]}],"activeMenuId":"default","knowledgeBase":[{"id":"1776416559497","title":"О компании","content":"<p><strong>Добро&nbsp;пожаловать&nbsp;в&nbsp;«Две&nbsp;Березки»!</strong></p><p>Наш&nbsp;комплекс&nbsp;«Две&nbsp;Березки»&nbsp;—&nbsp;это&nbsp;не&nbsp;просто&nbsp;место&nbsp;для&nbsp;ночлега&nbsp;и&nbsp;еды.&nbsp;Это&nbsp;место,&nbsp;где&nbsp;гости&nbsp;отдыхают&nbsp;душой.</p><p><strong>Наши&nbsp;главные&nbsp;ценности:</strong></p><ul><li><strong>Искренний&nbsp;сервис:</strong>&nbsp;Мы&nbsp;решаем&nbsp;проблемы&nbsp;гостя&nbsp;до&nbsp;того,&nbsp;как&nbsp;они&nbsp;испортят&nbsp;ему&nbsp;настроение.</li><li><strong>Командная&nbsp;работа:</strong>&nbsp;У&nbsp;нас&nbsp;нет&nbsp;слова&nbsp;«это&nbsp;не&nbsp;моя&nbsp;обязанность».&nbsp;Если&nbsp;гостю&nbsp;нужна&nbsp;помощь,&nbsp;мы&nbsp;помогаем&nbsp;вместе.</li><li><strong>Чистота&nbsp;и&nbsp;эстетика:</strong>&nbsp;Мы&nbsp;поддерживаем&nbsp;идеальный&nbsp;порядок&nbsp;на&nbsp;каждом&nbsp;квадратном&nbsp;метре&nbsp;нашего&nbsp;комплекса.</li></ul><p>Мы&nbsp;рады&nbsp;видеть&nbsp;вас&nbsp;в&nbsp;нашей&nbsp;команде!</p>"},{"id":"1776416579561","title":"Работа и льготы","content":"<p><strong>Корпоративные&nbsp;бонусы&nbsp;для&nbsp;сотрудников</strong></p><p>Мы&nbsp;ценим&nbsp;ваш&nbsp;труд&nbsp;и&nbsp;предлагаем&nbsp;следующие&nbsp;бонусы&nbsp;для&nbsp;сотрудников,&nbsp;прошедших&nbsp;испытательный&nbsp;срок:</p><ul><li>Бесплатное&nbsp;двухразовое&nbsp;питание&nbsp;в&nbsp;рабочие&nbsp;смены&nbsp;(завтрак&nbsp;и&nbsp;обед/ужин).</li><li>Скидка&nbsp;30%&nbsp;на&nbsp;все&nbsp;меню&nbsp;ресторана&nbsp;в&nbsp;нерабочее&nbsp;время&nbsp;для&nbsp;вас&nbsp;и&nbsp;вашей&nbsp;семьи.</li><li>Бесплатная&nbsp;униформа&nbsp;и&nbsp;ее&nbsp;химчистка&nbsp;за&nbsp;счет&nbsp;компании.</li><li>Помощь&nbsp;в&nbsp;организации&nbsp;трансфера&nbsp;после&nbsp;поздних&nbsp;смен&nbsp;(развоз&nbsp;на&nbsp;такси).</li></ul><p></p>"},{"id":"1776416601517","title":"Стандарты сервиса","content":"<p><strong>Как&nbsp;правильно&nbsp;реагировать&nbsp;на&nbsp;жалобу&nbsp;гостя&nbsp;(Правило&nbsp;LAST)</strong></p><p>Если&nbsp;гость&nbsp;чем-то&nbsp;недоволен,&nbsp;используйте&nbsp;международный&nbsp;стандарт&nbsp;<strong>LAST</strong>:</p><ul><li><strong>L&nbsp;(Listen)&nbsp;-&nbsp;Выслушайте:</strong>&nbsp;Не&nbsp;перебивайте,&nbsp;дайте&nbsp;гостю&nbsp;выговориться.</li><li><strong>A&nbsp;(Apologize)&nbsp;-&nbsp;Извинитесь:</strong>&nbsp;Искренне&nbsp;извинитесь&nbsp;за&nbsp;доставленные&nbsp;неудобства,&nbsp;даже&nbsp;если&nbsp;это&nbsp;не&nbsp;ваша&nbsp;личная&nbsp;вина.</li><li><strong>S&nbsp;(Solve)&nbsp;-&nbsp;Решите:</strong>&nbsp;Предложите&nbsp;вариант&nbsp;решения&nbsp;проблемы&nbsp;прямо&nbsp;сейчас.&nbsp;Если&nbsp;не&nbsp;можете&nbsp;сами&nbsp;—&nbsp;немедленно&nbsp;позовите&nbsp;менеджера.</li><li><strong>T&nbsp;(Thank)&nbsp;-&nbsp;Поблагодарите:</strong>&nbsp;Скажите&nbsp;спасибо&nbsp;за&nbsp;то,&nbsp;что&nbsp;гость&nbsp;указал&nbsp;нам&nbsp;на&nbsp;ошибку&nbsp;и&nbsp;помог&nbsp;стать&nbsp;лучше.</li></ul><p></p>"}],"safetyRules":[{"id":"1776416647715","title":"Общая пожарная безопасность","content":"<p><strong>При&nbsp;обнаружении&nbsp;возгорания&nbsp;или&nbsp;задымления:</strong></p><ol><li>Немедленно&nbsp;сообщите&nbsp;об&nbsp;этом&nbsp;менеджеру&nbsp;смены&nbsp;и&nbsp;на&nbsp;пост&nbsp;охраны.</li><li>При&nbsp;необходимости&nbsp;вызовите&nbsp;пожарную&nbsp;охрану&nbsp;по&nbsp;номеру&nbsp;<strong>112</strong>.</li><li>Оповестите&nbsp;гостей&nbsp;и&nbsp;укажите&nbsp;им&nbsp;пути&nbsp;эвакуации&nbsp;(спокойно,&nbsp;без&nbsp;паники!).&nbsp;Схемы&nbsp;эвакуации&nbsp;висят&nbsp;на&nbsp;каждом&nbsp;этаже.</li><li>Не&nbsp;пользуйтесь&nbsp;лифтами&nbsp;во&nbsp;время&nbsp;пожарной&nbsp;тревоги!</li><li><strong>Важно:</strong>&nbsp;Приступайте&nbsp;к&nbsp;тушению&nbsp;огня&nbsp;огнетушителем,&nbsp;ТОЛЬКО&nbsp;если&nbsp;это&nbsp;не&nbsp;угрожает&nbsp;вашей&nbsp;жизни&nbsp;и&nbsp;возгорание&nbsp;небольшое.</li></ol><p></p>"},{"id":"1776416675963","title":"Техника безопасности на кухне и в ресторане","content":"<ol><li><strong>Острые&nbsp;предметы:</strong>&nbsp;Передавайте&nbsp;ножи&nbsp;только&nbsp;ручкой&nbsp;вперед.&nbsp;Храните&nbsp;ножи&nbsp;в&nbsp;строго&nbsp;отведенных&nbsp;магнитных&nbsp;держателях&nbsp;или&nbsp;ящиках.&nbsp;Не&nbsp;пытайтесь&nbsp;поймать&nbsp;падающий&nbsp;нож!</li><li><strong>Горячие&nbsp;поверхности&nbsp;и&nbsp;пар:</strong>&nbsp;Предупреждайте&nbsp;коллег&nbsp;громким&nbsp;словом&nbsp;«ГОРЯЧО!»,&nbsp;когда&nbsp;несете&nbsp;кипяток&nbsp;или&nbsp;горячую&nbsp;посуду.&nbsp;Открывайте&nbsp;крышки&nbsp;кастрюль&nbsp;и&nbsp;пароконвектоматов&nbsp;от&nbsp;себя,&nbsp;чтобы&nbsp;не&nbsp;обжечь&nbsp;лицо&nbsp;паром.</li><li><strong>Мокрый&nbsp;пол:</strong>&nbsp;Если&nbsp;вы&nbsp;что-то&nbsp;пролили&nbsp;(или&nbsp;увидели&nbsp;лужу),&nbsp;немедленно&nbsp;вытрите&nbsp;это&nbsp;место&nbsp;или&nbsp;поставьте&nbsp;желтую&nbsp;табличку&nbsp;«Осторожно,&nbsp;мокрый&nbsp;пол».</li><li><strong>Электроприборы:</strong>&nbsp;Запрещается&nbsp;работать&nbsp;с&nbsp;электрооборудованием&nbsp;мокрыми&nbsp;руками.&nbsp;При&nbsp;любой&nbsp;неисправности&nbsp;провода&nbsp;или&nbsp;розетки&nbsp;немедленно&nbsp;обесточьте&nbsp;прибор&nbsp;и&nbsp;вызовите&nbsp;техника.</li></ol>"}]}	2026-06-17 08:25:40.769
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
28bc4998-ff47-4561-a097-3d5029ae302a	bd06266e137ffcfcec30521e4e02b26186c6fef41b4ba9bc0fab78aa7e52517d	2026-03-23 17:22:57.059677+00	20260323172255_init	\N	\N	2026-03-23 17:22:56.454748+00	1
\.


--
-- Data for Name: feedback_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback_comments (id, content, "feedbackId", "authorId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: feedbacks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedbacks (id, type, title, content, priority, status, "isAnonymous", "authorId", "createdAt", "updatedAt") FROM stdin;
083f7fdc-c9be-4ece-ac9e-23eeb09631f9	PROBLEM	Сломался кондиционер	В номере 302 не работает охлаждение	HIGH	IN_PROGRESS	f	cbaaf155-4ec1-412b-a714-ef19bbee0fe7	2026-03-24 09:32:01.207	2026-03-24 09:33:11.465
cda1f850-9fc7-476a-80b9-9972921e1f80	PROBLEM	Не работает ТВ в номере 101	Сломалась приставка, надо починить.	MEDIUM	NEW	f	42af6dc6-f036-442d-8aca-1de7989f2542	2026-03-26 07:24:50.048	2026-03-26 07:24:50.048
8c150a4c-240a-4a07-9392-e82804ded02e	PROBLEM	🔄 ПОИСК ЗАМЕНЫ: Смена 03.04.2026	Смена 03.04.2026 (09:00 - 18:00, отдел: Ресепшн) выставлена на биржу.	MEDIUM	NEW	f	42af6dc6-f036-442d-8aca-1de7989f2542	2026-04-03 09:17:47.473	2026-04-03 09:17:47.473
dd4a9d3d-3313-4d04-82d7-d285a29df605	PROBLEM	🚨 БОЛЬНИЧНЫЙ: Смена 29.03.2026	Пожалуйста, снимите меня со смены 29.03.2026 (09:00 - 18:00, отдел: Ресепшн). Я заболел.	HIGH	RESOLVED	f	42af6dc6-f036-442d-8aca-1de7989f2542	2026-03-28 09:46:56.533	2026-04-03 10:38:30.362
f6197ee8-57aa-48f9-bcca-51afcd7b7b26	PROBLEM	🔄 ПОИСК ЗАМЕНЫ: Смена 29.03.2026	Ищу замену на свою смену 29.03.2026 (09:00 - 18:00, отдел: Ресепшн). Пожалуйста, подтвердите перенос.	MEDIUM	RESOLVED	f	42af6dc6-f036-442d-8aca-1de7989f2542	2026-03-28 09:48:02.186	2026-04-03 10:38:32.311
5334280b-5d10-431a-9099-14a65fc0fd75	PROBLEM	🔄 ПОИСК ЗАМЕНЫ: Смена 03.04.2026	Ищу замену на свою смену 03.04.2026 (09:00 - 18:00, отдел: Ресепшн). Пожалуйста, подтвердите перенос.	MEDIUM	RESOLVED	f	42af6dc6-f036-442d-8aca-1de7989f2542	2026-04-03 09:12:49.542	2026-04-03 10:38:33.588
fb47374e-62e2-4df7-98ea-28cc412e7250	PROBLEM	🔄 ПОИСК ЗАМЕНЫ: Смена 07.04.2026	Смена 07.04.2026 (09:00 - 18:00, отдел: Ресепшн) выставлена на биржу.	MEDIUM	NEW	f	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-07 11:20:59.229	2026-04-07 11:20:59.229
51b20ef9-05d0-462a-96d5-619a8f486297	PROBLEM	🚨 БОЛЬНИЧНЫЙ: Смена 07.04.2026	Пожалуйста, снимите меня со смены 07.04.2026 (09:00 - 18:00, отдел: Ресепшн). Я заболел.	HIGH	RESOLVED	f	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-07 11:21:21.08	2026-04-07 11:21:34.101
fc585831-55f3-4d47-8e92-7b1fd8e0da0f	PROBLEM	🚨 БОЛЬНИЧНЫЙ: Смена 07.04.2026	Пожалуйста, снимите меня со смены 07.04.2026 (09:00 - 18:00, отдел: Ресепшн). Я заболел.	HIGH	RESOLVED	f	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-07 13:43:23.059	2026-04-07 13:43:54.946
670046e5-afeb-4f02-8343-83c3dedc6093	PROBLEM	🔄 ПОИСК ЗАМЕНЫ: Смена 07.04.2026	Смена 07.04.2026 (09:00 - 18:00, отдел: Ресепшн) выставлена на биржу.	MEDIUM	NEW	f	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-07 13:44:22.614	2026-04-07 13:44:22.614
7372920d-bc03-4ea6-be0a-fa90bc7224b4	PROBLEM	🚨 БОЛЬНИЧНЫЙ: Смена 07.04.2026	Пожалуйста, снимите меня со смены 07.04.2026 (09:00 - 18:00, отдел: Ресепшн). Я заболел.	HIGH	RESOLVED	f	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-07 13:54:53.151	2026-04-07 13:55:25.965
94a583fb-a454-4aa8-9523-25f1784eaf77	PROBLEM	🚨 БОЛЬНИЧНЫЙ: Смена 07.04.2026	Пожалуйста, снимите меня со смены 07.04.2026 (09:00 - 18:00, отдел: Ресепшн). Я заболел.	HIGH	RESOLVED	f	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-07 13:56:14.255	2026-04-07 13:56:27.638
99b7dd4a-0446-47a9-9e84-8be9cb8e9972	PROBLEM	🔄 ПОИСК ЗАМЕНЫ: Смена 15.04.2026	Смена 15.04.2026 (09:00 - 18:00, отдел: Ресепшн) выставлена на биржу.	MEDIUM	NEW	f	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-15 16:23:25.295	2026-04-15 16:23:25.295
456bc24a-f456-4f0e-b2ab-061fc67da243	PROBLEM	🚨 БОЛЬНИЧНЫЙ: Смена 15.04.2026	Пожалуйста, снимите меня со смены 15.04.2026 (09:00 - 18:00, отдел: Ресепшн). Я заболел.	HIGH	RESOLVED	f	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-15 16:24:08.924	2026-04-15 16:24:21.307
6d6b5601-7eed-4dc4-871f-56544ed86de9	PROBLEM	 Сломался кондиционер	<p><span style="background-color: rgb(255, 255, 255); color: rgb(75, 85, 99);">В&nbsp;номере&nbsp;302&nbsp;не&nbsp;работает&nbsp;кондиционер</span></p>	MEDIUM	NEW	f	0600c0f2-b152-4434-97ab-2020347701f3	2026-06-16 10:17:04.1	2026-06-16 10:17:04.1
41c07b04-35ba-4693-9469-4515a65b92cc	PROBLEM	Не работает ТВ	<p>В&nbsp;номере&nbsp;107&nbsp;не&nbsp;работает&nbsp;телевизор</p>	MEDIUM	NEW	f	0600c0f2-b152-4434-97ab-2020347701f3	2026-06-16 10:17:39.64	2026-06-16 10:17:39.64
\.


--
-- Data for Name: knowledge_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.knowledge_materials (id, title, category, content, "pdfUrl", "authorId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news (id, title, content, "imageUrl", "publishedAt", "authorId", "createdAt", "updatedAt") FROM stdin;
83f94413-ab3d-48a2-917c-e5b74c613e50	Важная новость	Завтра проверка!	\N	2026-03-24 08:50:34.524	cbaaf155-4ec1-412b-a714-ef19bbee0fe7	2026-03-24 08:50:34.524	2026-03-24 08:50:34.524
b1146be7-55f1-4b23-ab8d-c7444cba9a57	Новое меню в лобби-баре! 🍰	Уважаемые коллеги! Рады сообщить, что с завтрашнего дня в нашем лобби-баре запускается обновленное меню десертов. Приглашаем всех на дегустацию во время перерыва!	\N	2026-03-26 08:28:32.584	42af6dc6-f036-442d-8aca-1de7989f2542	2026-03-26 08:28:32.584	2026-03-26 08:28:32.584
57c76051-0827-464f-8d71-f37d4561d46d	Доставка	Нужно разгрузить товар на склад	\N	2026-03-28 09:27:22.162	42af6dc6-f036-442d-8aca-1de7989f2542	2026-03-28 09:27:22.162	2026-03-28 09:27:22.162
c8d7da44-271e-4135-8aa5-a14addc77362	Заселение	Заселите клиента в номер 103	\N	2026-04-03 07:23:22.371	42af6dc6-f036-442d-8aca-1de7989f2542	2026-04-03 07:23:22.371	2026-04-03 07:23:22.371
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shifts (id, department, date, "startTime", "endTime", "employeeId", "createdById", "createdAt", "updatedAt", "actualEndTime", "actualStartTime", "isLookingForSwap", status) FROM stdin;
e8f404f3-14d4-44eb-b8e1-c1d3c0656dd5	Ресепшн	2026-03-25	08:00	20:00	cbaaf155-4ec1-412b-a714-ef19bbee0fe7	cbaaf155-4ec1-412b-a714-ef19bbee0fe7	2026-03-24 09:18:46.042	2026-03-24 09:18:46.042	\N	\N	f	SCHEDULED
df3a4563-bc8a-4709-8d69-06882f04cd4f	Лобби-бар	2026-03-27	10:00	22:00	42af6dc6-f036-442d-8aca-1de7989f2542	42af6dc6-f036-442d-8aca-1de7989f2542	2026-03-26 07:19:22.818	2026-03-26 07:19:22.818	\N	\N	f	SCHEDULED
d105a7c9-5fc3-4e2f-b2bb-541493e7c179	Ресепшн	2026-03-26	09:00	18:00	61fa2f91-c96a-4380-a9b2-f2ef02e37d21	42af6dc6-f036-442d-8aca-1de7989f2542	2026-03-26 08:59:26.149	2026-03-26 08:59:26.149	\N	\N	f	SCHEDULED
a7a99911-a4aa-4536-a8a5-ea4ca7a705d3	Ресепшн	2026-03-29	09:00	18:00	42af6dc6-f036-442d-8aca-1de7989f2542	42af6dc6-f036-442d-8aca-1de7989f2542	2026-03-28 09:12:59.357	2026-03-28 09:12:59.357	\N	\N	f	SCHEDULED
1644c03b-db4a-4c30-a8c4-bc25d65cf520	Ресепшн	2026-04-15	09:00	18:00	0600c0f2-b152-4434-97ab-2020347701f3	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-15 16:22:58.456	2026-04-15 16:41:22.066	2026-04-15 16:41:22.065	2026-04-15 16:41:19.321	f	COMPLETED
f9ce0cc3-c9e1-454b-873a-6d44b576feca	Ресепшн	2026-04-03	09:00	18:00	61fa2f91-c96a-4380-a9b2-f2ef02e37d21	42af6dc6-f036-442d-8aca-1de7989f2542	2026-04-03 09:12:40.83	2026-04-03 09:58:06.815	2026-04-03 18:00:00	2026-04-03 09:00:00	f	COMPLETED
cfcd5836-3d27-4193-a875-11e6be0ef369	Ресепшн	2026-04-03	09:00	18:00	42af6dc6-f036-442d-8aca-1de7989f2542	42af6dc6-f036-442d-8aca-1de7989f2542	2026-04-03 09:11:07.024	2026-04-03 09:58:06.815	2026-04-03 18:00:00	2026-04-03 09:00:00	f	COMPLETED
86e669dc-a012-416d-8ccf-0c55a700a009	Ресепшн	2026-04-18	09:00	18:00	0600c0f2-b152-4434-97ab-2020347701f3	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-18 06:25:01.637	2026-04-18 06:25:40.113	2026-04-18 06:25:40.111	2026-04-18 06:25:25.965	f	COMPLETED
d328a150-b964-427a-90bd-574afe760aae	Ресепшн	2026-04-07	09:00	18:00	42af6dc6-f036-442d-8aca-1de7989f2542	42af6dc6-f036-442d-8aca-1de7989f2542	2026-04-07 12:08:45.831	2026-04-07 12:08:45.831	\N	\N	f	SCHEDULED
d885f702-9510-4cd7-846f-07c9f16caff9	Ресепшн	2026-05-17	09:00	18:00	0600c0f2-b152-4434-97ab-2020347701f3	0600c0f2-b152-4434-97ab-2020347701f3	2026-05-16 23:46:48.492	2026-05-16 23:47:06.643	2026-05-16 23:47:06.642	2026-05-16 23:46:57.181	f	COMPLETED
a76f50dd-6f24-49ae-a3a1-3a2eda1f8cf2	Ресепшн	2026-05-28	09:00	18:00	0600c0f2-b152-4434-97ab-2020347701f3	0600c0f2-b152-4434-97ab-2020347701f3	2026-05-28 17:19:01.732	2026-05-28 17:19:01.732	\N	\N	f	SCHEDULED
38c47146-59f9-468b-9cd6-5ec30e0f016c	Ресепшн	2026-06-16	09:00	18:00	0600c0f2-b152-4434-97ab-2020347701f3	0600c0f2-b152-4434-97ab-2020347701f3	2026-06-16 10:14:34.794	2026-06-16 10:14:34.794	\N	\N	f	SCHEDULED
070b208e-492e-4ace-b1e1-0fbbaf9cab9e	Ресепшн	2026-04-07	09:00	18:00	0600c0f2-b152-4434-97ab-2020347701f3	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-07 11:20:41.032	2026-04-07 13:56:42.641	\N	\N	f	SCHEDULED
c5be9dd0-9c63-4bce-a990-d1ea48485c00	Ресепшн	2026-04-14	09:00	18:00	0600c0f2-b152-4434-97ab-2020347701f3	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-14 09:18:07.256	2026-04-14 09:43:16.386	2026-04-14 09:43:16.385	2026-04-14 09:43:07.396	f	COMPLETED
5e169cf8-5810-4b3c-8678-ab769d67e7c7	Ресепшн	2026-04-14	09:00	12:47	0600c0f2-b152-4434-97ab-2020347701f3	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-14 09:44:09.985	2026-04-14 09:47:00.539	2026-04-14 09:47:00	2026-04-14 09:44:19.023	f	COMPLETED
c26fcdaa-3f5f-462b-adc8-f7f405e3bca4	Ресепшн	2026-06-16	09:00	18:00	61fa2f91-c96a-4380-a9b2-f2ef02e37d21	0600c0f2-b152-4434-97ab-2020347701f3	2026-06-16 11:09:10.379	2026-06-16 11:10:39.142	2026-06-16 11:10:39.14	2026-06-16 11:10:27.293	f	COMPLETED
f59e3b76-2841-4924-ac78-bbf64f61f9b9	Ресепшн	2026-04-15	09:00	18:00	0600c0f2-b152-4434-97ab-2020347701f3	0600c0f2-b152-4434-97ab-2020347701f3	2026-04-15 16:20:44.215	2026-04-15 16:22:14.558	2026-04-15 16:22:14.556	2026-04-15 16:21:45.114	f	COMPLETED
94b37b08-8c20-469d-b71d-4cdd7de2a174	Ресепшн	2026-06-16	09:00	18:00	61fa2f91-c96a-4380-a9b2-f2ef02e37d21	0600c0f2-b152-4434-97ab-2020347701f3	2026-06-16 11:14:09.331	2026-06-16 11:16:16.21	2026-06-16 11:16:16.208	2026-06-16 11:16:08.557	f	COMPLETED
3f9e617d-643c-4c6f-923b-adff3db82dd6	Ресепшн	2026-06-16	09:00	18:00	61fa2f91-c96a-4380-a9b2-f2ef02e37d21	0600c0f2-b152-4434-97ab-2020347701f3	2026-06-16 11:22:05.246	2026-06-16 11:22:05.246	\N	\N	f	SCHEDULED
d83c407b-9e2a-4574-b293-93d890de9de9	Ресепшн	2026-06-16	09:00	18:00	61fa2f91-c96a-4380-a9b2-f2ef02e37d21	0600c0f2-b152-4434-97ab-2020347701f3	2026-06-16 11:24:46.356	2026-06-16 11:24:46.356	\N	\N	f	SCHEDULED
9918272e-1cc3-44b9-9623-17bddef5e461	Ресепшн	2026-06-17	09:00	18:00	61fa2f91-c96a-4380-a9b2-f2ef02e37d21	0600c0f2-b152-4434-97ab-2020347701f3	2026-06-17 08:24:32.769	2026-06-17 08:27:29.998	2026-06-17 08:27:29.996	2026-06-17 08:27:24.825	f	COMPLETED
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, "passwordHash", "fullName", department, "position", phone, role, "createdAt", "updatedAt", "avatarUrl", "hourlyRate", "isActive") FROM stdin;
94807755-246b-42f5-ae32-60460d476d22	manager@mail.ru	$2b$10$VSHdxR4BBkkTtztqZPfZLuhgMHybWpADY77LDLCWPKVD/edaT0gz2	Михаил Менеджеров	\N	\N	\N	MANAGER	2026-03-26 08:50:38.486	2026-04-07 10:27:06.434	\N	500	t
0600c0f2-b152-4434-97ab-2020347701f3	lastwinter28@bk.ru	$2b$10$kzlJOYTbYZrmkkzdrtNEjeOErU9XmWAhkDmhv8wQcdbCKP8DF7l36	Илья Неретин		Гл. Админимтратор	\N	SUPER_ADMIN	2026-04-07 10:09:27.668	2026-04-07 12:57:50.988	/uploads/avatar-1775556673913-440947263.jpg	500	t
a899441f-7928-4d61-ad5f-9126372add75	lastwinter24@bk.ru	$2b$10$S/BaA6523N2MyuSvXDx2WuEfK/21YT3KqLJKOnqegwDIRFBsWaXZK	Илья Рофлов	\N	\N	\N	ADMIN	2026-04-07 11:15:26.985	2026-04-07 12:57:50.988	\N	0	t
2deb6b84-bf5a-45ea-b91b-fa9542120cf4	chef@mail.ru	$2b$10$4roL/J791iiPJlydL2nj9.s8gD7nkGwr4NSdLpp4cAeBkQ8IlLHPm	Виктор Поваров	Кухня	Шев-повар	\N	CHEF	2026-03-28 07:24:48.77	2026-04-07 13:32:08.844	\N	500	t
cbaaf155-4ec1-412b-a714-ef19bbee0fe7	admin@hotel.com	$2b$10$R2Pj0mnJY4	Иван Иванов		Рабочий	\N	EMPLOYEE	2026-03-24 06:56:58.827	2026-06-17 08:26:33.625	\N	500	t
42af6dc6-f036-442d-8aca-1de7989f2542	admin@mail.ru	$2b$10$13gslb4qDi1YJ8r7a1QmdOzaoSaksQ02lj91sg6eghypg6tU3cVzG	Петр Смирнов		Администратор	\N	ADMIN	2026-03-24 11:57:26.572	2026-06-17 08:26:38.538	/uploads/avatar-1774512836832-750228934.jpg	500	f
61fa2f91-c96a-4380-a9b2-f2ef02e37d21	employee@mail.ru	$2b$10$dWO7qvxb7vnTtr0wBBdzpeF.UElKiP1Wd5hSvc.DlHyeo.Yh1w3IW	Анна Смирнова	Ресепшен	Рабочий	\N	EMPLOYEE	2026-03-26 08:44:38.456	2026-06-17 08:28:11.764	/uploads/avatar-1781684891757-968200841.jpg	500	t
\.


--
-- Name: PageContent PageContent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageContent"
    ADD CONSTRAINT "PageContent_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: feedback_comments feedback_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT feedback_comments_pkey PRIMARY KEY (id);


--
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (id);


--
-- Name: knowledge_materials knowledge_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_materials
    ADD CONSTRAINT knowledge_materials_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: PageContent_pageName_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PageContent_pageName_key" ON public."PageContent" USING btree ("pageName");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: feedback_comments feedback_comments_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT "feedback_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: feedback_comments feedback_comments_feedbackId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT "feedback_comments_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES public.feedbacks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: feedbacks feedbacks_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT "feedbacks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: knowledge_materials knowledge_materials_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_materials
    ADD CONSTRAINT "knowledge_materials_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: news news_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT "news_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shifts shifts_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "shifts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shifts shifts_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "shifts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict Gray1q5fVwgnwGcTEDGt0nEGJsdaKv0IWXQssfsAZcMz1tRzEBoNc5llq5uZBCL

