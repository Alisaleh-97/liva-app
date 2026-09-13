# LIVA — Privacy Policy

**Effective date:** REPLACE_WITH_LAUNCH_DATE
**Last updated:** REPLACE_WITH_LAUNCH_DATE

> ⚠️ This template captures the shape of LIVA's data handling, but a real
> privacy policy must be reviewed by a lawyer in every jurisdiction you
> ship in (at minimum: GDPR — EU/UK, CCPA — California, and the UAE PDPL if
> you list on the local App Stores). Replace every `REPLACE_WITH_*` marker
> and delete this callout before publishing.

## 1. Who we are

LIVA is operated by **REPLACE_WITH_LEGAL_ENTITY_NAME**, registered at
**REPLACE_WITH_REGISTERED_ADDRESS**. Contact us at
**privacy@REPLACE_WITH_DOMAIN.com** for any privacy question, or
**dpo@REPLACE_WITH_DOMAIN.com** to reach our Data Protection Officer.

## 2. What we collect

| Category                    | Examples                                                    | Why                                         |
| --------------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| Account                     | Email, phone, first + last name, password (bcrypt-hashed)   | Sign in, order fulfillment                  |
| Business account (sellers)  | Business name, category, address, tax ID                    | Legal seller verification, payouts          |
| Purchase history            | Orders, delivery slots, addresses                           | Fulfill and track orders                    |
| Interaction                 | Wishlist, saved searches, followed sellers, viewed items    | Personalize recommendations                 |
| Device                      | Device model, OS version, push token, IP address            | Send notifications, prevent fraud           |
| Diagnostics                 | Crash reports, performance events (via Sentry)              | Fix bugs                                    |
| Product analytics           | Event names + counts (via PostHog) — pseudonymous by user id | Product decisions                           |
| Location                    | Coarse location when you allow it                           | Estimate delivery, show nearby stores       |
| Camera / photos / mic       | Only when you tap the feature that uses them                | Barcode scan, AR try-on, product review     |

We **do not** sell your data. We **do not** show third-party ads inside LIVA.

## 3. Legal basis (GDPR)

- **Contract** — everything needed to create your account and complete orders.
- **Consent** — notifications, analytics, location, personalized recommendations. Revocable in Settings.
- **Legitimate interest** — fraud prevention, service security, aggregate reporting.

## 4. Sharing

We share the minimum data required with:

| Processor      | Purpose                     | Data                     | Region |
| -------------- | --------------------------- | ------------------------ | ------ |
| Stripe         | Payments                    | Card data (they hold it) | US/EU  |
| Cloudinary     | Image hosting               | Product photos           | US/EU  |
| Sentry         | Crash reports               | Error stack + user id    | US     |
| PostHog        | Product analytics           | Event names, user id     | US/EU  |
| Twilio / Expo  | SMS + push delivery         | Phone, push token        | US     |
| Google / Apple | SSO sign-in (only if used)  | Email, name              | US     |

We do not share your data with anyone else without a court order or your
explicit permission.

## 5. How long we keep it

- **Active account:** for as long as you have one.
- **Deleted account:** account record 30 days (soft delete for recovery), then hard-deleted. Orders retained 7 years for tax law.
- **Diagnostics:** 90 days.
- **Analytics:** 24 months.

## 6. Your rights

Anywhere in the world, you can email **privacy@REPLACE_WITH_DOMAIN.com** to:

- Get a copy of everything we hold about you (data export)
- Correct anything wrong
- Delete your account and its data
- Object to a specific processing (e.g. analytics)
- Withdraw a consent you gave earlier

In the EU/UK/California you additionally have the right to lodge a
complaint with your local data-protection authority.

## 7. Security

- Passwords hashed with bcrypt (12 rounds).
- Auth tokens stored in Keychain (iOS) / EncryptedSharedPreferences (Android).
- All API traffic over TLS 1.2+.
- Rate limiting on auth endpoints, strict CORS origin whitelist.

No online service is 100% secure. If you spot a vulnerability, please
report it to **security@REPLACE_WITH_DOMAIN.com** — we run a coordinated
disclosure process.

## 8. Children

LIVA is not directed at anyone under 13. Do not create an account if
you're under 13. If you're a parent and believe your child created one,
email **privacy@REPLACE_WITH_DOMAIN.com** and we'll delete it.

## 9. International transfers

Data may be processed in the US and EU by our processors listed above. We
rely on Standard Contractual Clauses (SCC) for transfers out of the EU
and equivalent safeguards elsewhere.

## 10. Changes

Material changes get an in-app notice **at least 14 days** before they
take effect. Non-material corrections (typos, links) may be published
without notice — the effective date at the top always reflects the
current version.

## 11. Contact

- Privacy questions: **privacy@REPLACE_WITH_DOMAIN.com**
- Data Protection Officer: **dpo@REPLACE_WITH_DOMAIN.com**
- Security disclosures: **security@REPLACE_WITH_DOMAIN.com**
- Postal: REPLACE_WITH_REGISTERED_ADDRESS
