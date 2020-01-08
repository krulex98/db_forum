CREATE EXTENSION IF NOT EXISTS CITEXT;

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS forums CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS votes CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nickname CITEXT COLLATE "ucs_basic" NOT NULL UNIQUE,
    fullname TEXT NOT NULL,
    email CITEXT NOT NULL UNIQUE,
    about TEXT
);

CREATE TABLE forums (
    id SERIAL PRIMARY KEY,
    slug CITEXT NOT NULL UNIQUE,
    posts INTEGER DEFAULT 0,
    threads INTEGER DEFAULT 0,
    title TEXT NOT NULL,
    username CITEXT REFERENCES users (nickname) NOT NULL
);

CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    slug CITEXT UNIQUE,
    username CITEXT REFERENCES users (nickname) NOT NULL,
    forum_slug CITEXT REFERENCES forums (slug) NOT NULL,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    title TEXT NOT NULL UNIQUE,
    votes INTEGER DEFAULT 0
);

CREATE OR REPLACE FUNCTION insertThread()
RETURNS TRIGGER AS
$BODY$
BEGIN
    UPDATE forums SET threads = threads + 1
    WHERE slug = new.forum_slug;
    RETURN new;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER insertThread
AFTER INSERT
ON threads
FOR EACH ROW
EXECUTE PROCEDURE insertThread();

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    username CITEXT REFERENCES users (nickname) NOT NULL,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    isEdited BOOLEAN DEFAULT FALSE,
    message TEXT,
    parent_id INTEGER REFERENCES posts (id),
    thread_id INTEGER REFERENCES threads (id) NOT NULL
);

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    username CITEXT REFERENCES users (nickname) NOT NULL,
    thread_id INTEGER REFERENCES threads (id) NOT NULL,
    voice INTEGER,
    CONSTRAINT unique_vote UNIQUE (username, thread_id)
);

CREATE OR REPLACE FUNCTION insertVote()
RETURNS TRIGGER AS
$BODY$
    BEGIN
        UPDATE threads SET votes = votes + new.voice
        WHERE id = new.thread_id;
        RETURN new;
    END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER insertVote
AFTER INSERT
ON votes
FOR EACH ROW
EXECUTE PROCEDURE insertVote();


CREATE OR REPLACE FUNCTION updateVote()
RETURNS TRIGGER AS
$BODY$
    BEGIN
        IF old.voice = -1 AND new.voice = 1 THEN
            UPDATE threads SET votes = votes + 2
            WHERE id = new.thread_id;
        END IF;
        IF old.voice = 1 AND new.voice = -1 THEN
            UPDATE threads SET votes = votes - 2
            WHERE id = new.thread_id;
        END IF;
        RETURN NEW;
    END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER updateVote
AFTER UPDATE
ON votes
FOR EACH ROW
EXECUTE PROCEDURE updateVote();