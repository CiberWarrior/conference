-- Abstracts: file upload is optional (form text is the source of truth).
ALTER TABLE abstracts
  ALTER COLUMN file_name DROP NOT NULL;

ALTER TABLE abstracts
  ALTER COLUMN file_path DROP NOT NULL;

ALTER TABLE abstracts
  ALTER COLUMN file_size DROP NOT NULL;
