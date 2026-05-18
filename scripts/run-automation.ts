// scripts/run-automation.ts
import dotenv from "dotenv";

// Load configuration
dotenv.config();

const CRON_SECRET = process.env.CRON_SECRET || "deeshora_secure_cron_9922_x";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function runAutomation() {
  console.log("=========================================");
  console.log("🤖 Starting Deeshora Operational Automation...");
  console.log(`🌐 Targeting Application Server: ${APP_URL}`);
  console.log("=========================================");

  try {
    // 1. Trigger subscription processing
    console.log("\n📦 1. Processing recurring subscription orders...");
    const subUrl = `${APP_URL}/api/cron/process-subscriptions?key=${CRON_SECRET}`;
    const subRes = await fetch(subUrl);
    
    if (subRes.ok) {
      const subData = await subRes.json();
      console.log("✅ Subscriptions processed successfully!");
      console.log(JSON.stringify(subData, null, 2));
    } else {
      console.error(`❌ Subscription trigger failed (HTTP ${subRes.status}):`, await subRes.text());
    }

    // 2. Trigger low stock notifications
    console.log("\n⚠️ 2. Processing low stock threshold alerts...");
    const stockUrl = `${APP_URL}/api/automate?key=${CRON_SECRET}`;
    const stockRes = await fetch(stockUrl);

    if (stockRes.ok) {
      const stockData = await stockRes.json();
      console.log("✅ Low stock alert automation complete!");
      console.log(JSON.stringify(stockData, null, 2));
    } else {
      console.error(`❌ Low stock trigger failed (HTTP ${stockRes.status}):`, await stockRes.text());
    }

  } catch (error) {
    console.error("💥 Critical error running automation jobs:", error);
  }

  console.log("\n=========================================");
  console.log("🏁 Operational Automation complete!");
  console.log("=========================================");
}

runAutomation();
