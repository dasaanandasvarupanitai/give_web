/**
 * One-time backfill: gives every task without a `startDate` the value of its
 * `createdAt`. Tasks without `startDate` are "always visible" in the app, so
 * this preserves both their visibility and their sort position while letting
 * the paginated dashboards (which order by startDate) include them.
 *
 * Idempotent: only tasks missing `startDate` are touched; re-running is safe.
 *
 * Usage:
 *   node scripts/backfill-task-startdate.mjs <path-to-service-account.json>
 *
 * Create the service account JSON in Firebase Console -> Project settings ->
 * Service accounts -> Generate new private key.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
    console.error(
        "Usage: node scripts/backfill-task-startdate.mjs <path-to-service-account.json>"
    );
    process.exit(1);
}

initializeApp({ credential: cert(readFileSync(serviceAccountPath, "utf8")) });
const db = getFirestore();

let scanned = 0;
let fixed = 0;
let skipped = 0;
let cursor = null;

while (true) {
    let q = db.collection("tasks").orderBy("__name__").limit(500);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    if (snap.empty) break;

    let writes = 0;
    const batch = db.batch();
    for (const docSnap of snap.docs) {
        scanned++;
        const data = docSnap.data();
        if (data.startDate !== undefined && data.startDate !== null) continue;
        if (!data.createdAt) {
            skipped++;
            console.warn(`Task ${docSnap.id} has neither startDate nor createdAt - skipped`);
            continue;
        }
        batch.update(docSnap.ref, { startDate: data.createdAt });
        writes++;
        fixed++;
    }
    if (writes > 0) await batch.commit();
    cursor = snap.docs[snap.docs.length - 1];
    process.stdout.write(`\rScanned ${scanned} tasks, fixed ${fixed}...`);
}

console.log(
    `\nDone. Scanned ${scanned} task(s), set startDate = createdAt on ${fixed}, skipped ${skipped}.`
);
process.exit(0);
