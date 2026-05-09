\set jwt_secret 'clave-secreta-captionit-segura-1234'
\set jwt_exp '86400' 

ALTER DATABASE postgres SET "app.settings.jwt_secret" TO :'jwt_secret';
ALTER DATABASE postgres SET "app.settings.jwt_exp" TO :'jwt_exp';
