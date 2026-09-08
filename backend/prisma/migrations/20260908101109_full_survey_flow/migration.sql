/*
  Warnings:

  - You are about to drop the column `city` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `dob` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "city",
DROP COLUMN "dob",
ADD COLUMN     "consented" BOOLEAN,
ADD COLUMN     "dest_lat" DOUBLE PRECISION,
ADD COLUMN     "dest_lng" DOUBLE PRECISION,
ADD COLUMN     "destination_area" TEXT,
ADD COLUMN     "destination_station" TEXT,
ADD COLUMN     "distribution_mode" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "feeder_mode" TEXT,
ADD COLUMN     "home_area" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "nearest_station" TEXT,
ADD COLUMN     "origin_lat" DOUBLE PRECISION,
ADD COLUMN     "origin_lng" DOUBLE PRECISION,
ADD COLUMN     "smart_card_number" TEXT,
ADD COLUMN     "travel_frequency" TEXT;
