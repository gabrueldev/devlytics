CREATE TABLE `tracked_links` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`first_opened_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracked_links_site_slug_unique` ON `tracked_links` (`site_id`,`slug`);