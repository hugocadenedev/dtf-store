-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "shippingPrice" REAL NOT NULL DEFAULT 8.90,
    "freeShippingThreshold" REAL NOT NULL DEFAULT 150.0,
    "vatPercent" REAL NOT NULL DEFAULT 20.0
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerFirstName" TEXT NOT NULL DEFAULT '',
    "customerLastName" TEXT NOT NULL DEFAULT '',
    "customerPhone" TEXT NOT NULL DEFAULT '',
    "customerCompany" TEXT NOT NULL DEFAULT '',
    "customerAddress" TEXT NOT NULL DEFAULT '',
    "customerPostalCode" TEXT NOT NULL DEFAULT '',
    "customerCity" TEXT NOT NULL DEFAULT '',
    "customerId" TEXT,
    "stripeSessionId" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "orderStatus" TEXT NOT NULL DEFAULT 'received',
    "totalAmount" REAL NOT NULL,
    "shippingAmount" REAL NOT NULL DEFAULT 0,
    "vatAmount" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "currency", "customerAddress", "customerCity", "customerCompany", "customerEmail", "customerFirstName", "customerId", "customerLastName", "customerName", "customerPhone", "customerPostalCode", "id", "orderStatus", "paymentStatus", "stripeSessionId", "totalAmount", "updatedAt") SELECT "createdAt", "currency", "customerAddress", "customerCity", "customerCompany", "customerEmail", "customerFirstName", "customerId", "customerLastName", "customerName", "customerPhone", "customerPostalCode", "id", "orderStatus", "paymentStatus", "stripeSessionId", "totalAmount", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
