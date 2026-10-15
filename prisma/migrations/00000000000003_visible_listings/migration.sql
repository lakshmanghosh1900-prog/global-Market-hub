CREATE OR REPLACE VIEW "v_visible_listings" AS
SELECT *
FROM "Product"
WHERE "isDelisted" = false;
