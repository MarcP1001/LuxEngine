import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Auto-sync all agents' listings every 6 hours
// This ensures prices, status changes, and new listings are reflected
// without agents needing to manually click "Sync"
crons.interval("auto-sync-listings", { hours: 6 }, internal.listings.autoSyncAll);

export default crons;
