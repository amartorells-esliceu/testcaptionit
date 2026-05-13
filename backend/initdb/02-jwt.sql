\set jwt_secret 'clave-secreta-captionit-segura-1234'
\set jwt_exp '86400' 

ALTER ROLE authenticator SET "app.settings.jwt_secret" TO 'clave-secreta-captionit-segura-1234';
ALTER ROLE authenticator SET "app.settings.jwt_exp" TO '86400';