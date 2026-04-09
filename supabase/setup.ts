/**
 * Database setup script - verifies tables and creates storage bucket.
 * Tables should be created via Supabase dashboard using the migration SQL.
 * Usage: npx tsx supabase/setup.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function createStorageBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "documents");

  if (!exists) {
    const { error } = await supabase.storage.createBucket("documents", {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    });
    if (error) {
      console.error("Failed to create storage bucket:", error.message);
    } else {
      console.log("Created storage bucket: documents");
    }
  } else {
    console.log("Storage bucket 'documents' already exists");
  }
}

async function verifyTables() {
  const tables = ["sessions", "documents", "submissions"];
  let allOk = true;
  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(0);
    if (error) {
      console.error(`✗ Table '${table}' check failed:`, error.message);
      allOk = false;
    } else {
      console.log(`✓ Table '${table}' exists`);
    }
  }
  return allOk;
}

async function main() {
  console.log("Running database setup verification...\n");

  console.log("1. Verifying tables...");
  const tablesOk = await verifyTables();

  console.log("\n2. Checking storage bucket...");
  await createStorageBucket();

  if (tablesOk) {
    console.log("\n✓ All checks passed!");
  } else {
    console.log("\n✗ Some checks failed. Run the migration SQL in Supabase dashboard.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
