/*
  Warnings:

  - The primary key for the `Customer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `lastPurchase` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `totalOrders` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `totalSpent` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Customer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";

-- AlterTable
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_pkey",
DROP COLUMN "address",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "lastPurchase",
DROP COLUMN "phone",
DROP COLUMN "tags",
DROP COLUMN "totalOrders",
DROP COLUMN "totalSpent",
DROP COLUMN "updatedAt";
