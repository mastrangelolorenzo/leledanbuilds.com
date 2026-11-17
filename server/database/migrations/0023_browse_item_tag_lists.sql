-- build_type, theme and category each held ONE term. A product can now carry
-- several, stored in the same TEXT column as a JSON array -- the shape the
-- pricing table already uses for its feature list.
--
-- No new columns, so nothing to roll back structurally; this only rewrites
-- the values in place. Every row must come out as valid JSON, because the
-- taxonomy admin's usage counts, delete guard and rename now read these
-- columns with json_each(), which errors on a value that is not JSON.
--
-- The CASE is what keeps that promise on the three shapes actually in the
-- table: '' (a skinpack's empty build_type/theme) becomes an empty list, an
-- already-converted value is left alone, and a bare term becomes a
-- one-element list. json_array() would otherwise turn '' into [""], a list
-- holding one empty term, which would then show up as a blank chip.

UPDATE browse_items
SET build_type = CASE
      WHEN build_type IS NULL OR build_type = '' THEN '[]'
      WHEN json_valid(build_type) AND json_type(build_type) = 'array' THEN build_type
      ELSE json_array(build_type)
    END,
    theme = CASE
      WHEN theme IS NULL OR theme = '' THEN '[]'
      WHEN json_valid(theme) AND json_type(theme) = 'array' THEN theme
      ELSE json_array(theme)
    END,
    category = CASE
      WHEN category IS NULL OR category = '' THEN '[]'
      WHEN json_valid(category) AND json_type(category) = 'array' THEN category
      ELSE json_array(category)
    END;
