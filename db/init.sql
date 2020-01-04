
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nickname TEXT NOT NULL UNIQUE,
    fullname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    about TEXT
);