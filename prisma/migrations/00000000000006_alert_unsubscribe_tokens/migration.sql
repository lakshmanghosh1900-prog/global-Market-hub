ALTER TABLE "OfferAlertSubscription"
  ADD COLUMN "unsubscribeToken" TEXT;

CREATE UNIQUE INDEX "OfferAlertSubscription_unsubscribeToken_key"
  ON "OfferAlertSubscription"("unsubscribeToken");
