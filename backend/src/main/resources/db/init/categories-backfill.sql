DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'categories'
    ) THEN
        IF EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'categories_name_key'
        ) THEN
            ALTER TABLE categories DROP CONSTRAINT categories_name_key;
        END IF;

        ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(120);
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS path VARCHAR(500);
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id BIGINT;
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER;
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

        ALTER TABLE categories ALTER COLUMN sort_order SET DEFAULT 0;
        ALTER TABLE categories ALTER COLUMN is_active SET DEFAULT TRUE;

        UPDATE categories
        SET sort_order = 0
        WHERE sort_order IS NULL;

        UPDATE categories
        SET is_active = TRUE
        WHERE is_active IS NULL;

        WITH slug_sources AS (
            SELECT
                id,
                COALESCE(NULLIF(BTRIM(name), ''), 'category-' || id::text) AS source_name
            FROM categories
            WHERE slug IS NULL OR BTRIM(slug) = ''
        ),
        slug_candidates AS (
            SELECT
                id,
                COALESCE(
                    NULLIF(
                        REGEXP_REPLACE(
                            REGEXP_REPLACE(
                                TRANSLATE(
                                    LOWER(source_name),
                                    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
                                    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
                                ),
                                '[^a-z0-9]+',
                                '-',
                                'g'
                            ),
                            '(^-+|-+$)',
                            '',
                            'g'
                        ),
                        ''
                    ),
                    'category-' || id::text
                ) AS base_slug
            FROM slug_sources
        ),
        ranked_slugs AS (
            SELECT
                id,
                base_slug,
                ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS duplicate_rank
            FROM slug_candidates
        )
        UPDATE categories c
        SET slug = CASE
            WHEN ranked_slugs.duplicate_rank = 1 THEN LEFT(ranked_slugs.base_slug, 120)
            ELSE LEFT(
                ranked_slugs.base_slug,
                GREATEST(1, 120 - LENGTH(c.id::text) - 1)
            ) || '-' || c.id::text
        END
        FROM ranked_slugs
        WHERE c.id = ranked_slugs.id;

        WITH path_candidates AS (
            SELECT
                c.id,
                c.slug,
                COUNT(*) OVER (PARTITION BY c.slug) AS duplicate_slug_count,
                EXISTS (
                    SELECT 1
                    FROM categories existing_category
                    WHERE existing_category.id <> c.id
                      AND existing_category.path IS NOT NULL
                      AND BTRIM(existing_category.path) <> ''
                      AND existing_category.path = c.slug
                ) AS has_existing_path_conflict
            FROM categories c
            WHERE c.path IS NULL OR BTRIM(c.path) = ''
        )
        UPDATE categories c
        SET path = CASE
            WHEN path_candidates.duplicate_slug_count = 1
                 AND NOT path_candidates.has_existing_path_conflict
                THEN c.slug
            ELSE LEFT(
                c.slug,
                GREATEST(1, 500 - LENGTH(c.id::text) - 1)
            ) || '-' || c.id::text
        END
        FROM path_candidates
        WHERE c.id = path_candidates.id;

        ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
        ALTER TABLE categories ALTER COLUMN path SET NOT NULL;
        ALTER TABLE categories ALTER COLUMN sort_order SET NOT NULL;
        ALTER TABLE categories ALTER COLUMN is_active SET NOT NULL;

        CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
        CREATE INDEX IF NOT EXISTS idx_categories_path ON categories(path);
        CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
        CREATE INDEX IF NOT EXISTS idx_categories_parent_sort_order ON categories(parent_id, sort_order);
        CREATE UNIQUE INDEX IF NOT EXISTS uk_categories_path ON categories(path);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'fk_categories_parent'
        ) THEN
            ALTER TABLE categories
                ADD CONSTRAINT fk_categories_parent
                FOREIGN KEY (parent_id)
                REFERENCES categories(id)
                ON DELETE RESTRICT;
        END IF;
    END IF;
END $$@@
