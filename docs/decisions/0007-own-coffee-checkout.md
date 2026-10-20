# 0007 — Own coffee checkout on top of the Cakto payments API

## Context

The coffee button sent people to Cakto's hosted checkout, which leaves the product site and looks like someone else's page.

## Decision

The checkout lives at `/cafe` and `/en/coffee` and charges through `POST /public_api/payments/`:

- **Pix:** the API creates the charge and returns the copy-and-paste code; the browser draws the QR code itself because Cakto does not send an image.
- **Card:** the Cakto browser SDK tokenizes the card, runs 3DS and the antifraud profile, so the card number never reaches our Worker. We charge with `paymentMethod: "threeDs"` to move chargeback liability to the issuer.
- **Confirmation:** the page polls `GET /api/coffees/orders/:id` every 3 seconds, which reads the ledger the webhook already fills. A Durable Object with a WebSocket would save a few requests but adds a moving part for a page that is open for a few minutes.
- The access token lives in the isolate and in the edge cache, and is renewed once on `401`: Cakto answers `slow_down` when tokens are issued too often.
- `POST /api/coffees/*` is rate limited per IP so nobody can burn the Cakto quota by spamming charges.

## Consequences

- Cakto requires name, e-mail, phone and CPF for every charge (it answers "docNumber é obrigatório para pagamentos no Brasil ou Argentina"), so the form asks for all of them in both languages. Paying from abroad would need a foreign address flow, left for later.
- Everything is charged in BRL; the dollar price is a reference.
- Card payments can only be tested with a real charge, since Cakto has no sandbox.
