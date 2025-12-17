-- V14__rename_image_linking_to_word_linking.sql
UPDATE exercise_sessions
SET type = 'WORD_LINKING'
WHERE type = 'IMAGE_LINKING';