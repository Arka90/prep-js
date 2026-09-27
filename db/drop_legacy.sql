-- ─────────────────────────────────────────────────────────────────────────────
-- Removes every table from PrepJS v1 so you can start from an empty database.
-- THIS DELETES ALL OLD QUIZ DATA PERMANENTLY. Export anything you want first.
-- Then run db/schema.sql.
-- ─────────────────────────────────────────────────────────────────────────────

drop table if exists flashcard_reviews        cascade;
drop table if exists flashcards               cascade;
drop table if exists revision_items           cascade;
drop table if exists covered_react_subtopics  cascade;
drop table if exists react_topic_performance  cascade;
drop table if exists react_quiz_attempts      cascade;
drop table if exists covered_subtopics        cascade;
drop table if exists achievements             cascade;
drop table if exists topic_performance        cascade;
drop table if exists quiz_attempts            cascade;
drop table if exists users                    cascade;
