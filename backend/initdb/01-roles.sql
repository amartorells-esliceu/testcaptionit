\set pgpass 'captionit@1234'

CREATE ROLE postgres WITH LOGIN PASSWORD :'pgpass';
CREATE ROLE anon NOINHERIT;
CREATE ROLE authenticator WITH LOGIN PASSWORD :'pgpass';
GRANT anon TO authenticator;

GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
