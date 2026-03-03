ALTER TABLE `user_profile`
ADD COLUMN `credits_image_edits` integer DEFAULT 2 NOT NULL;
--> statement-breakpoint
UPDATE `user_profile`
SET `credits_image_edits` = COALESCE(`credits_product_shoots`, 0) + COALESCE(`credits_ad_graphics`, 0);
