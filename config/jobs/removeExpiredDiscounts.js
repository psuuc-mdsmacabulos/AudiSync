import cron from "node-cron";
import { AppDataSource } from "../data-source.js";
import Discount from "../../dist/discounts.js";
import { LessThan } from "typeorm";

// Function to remove expired discounts
const removeExpiredDiscounts = async () => {
    try {
        // Check if the database connection is initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("Database connection initialized for discount cleanup.");
        }

        const discountRepository = AppDataSource.getRepository(Discount);
        const now = new Date();
        const nowISO = now.toISOString();

        console.log(`Starting cleanup of expired discounts at ${nowISO}...`);

        // Delete discounts where end_date is less than the current time
        const result = await discountRepository.delete({ end_date: LessThan(now) });

        if (result.affected > 0) {
            console.log(`Successfully removed ${result.affected} expired discounts at ${nowISO}.`);
        } else {
            console.log(`No expired discounts found to remove at ${nowISO}.`);
        }
    } catch (error) {
        console.error(`Error removing expired discounts at ${new Date().toISOString()}:`, {
            message: error.message,
            stack: error.stack,
        });
    }
};

// Schedule the cleanup to run every 15 minutes
cron.schedule("*/1 * * * *", () => {
    console.log(`🔄 Running expired discount cleanup at ${new Date().toISOString()}...`);
    removeExpiredDiscounts();
}, {
    scheduled: true,
    timezone: "Asia/Manila"
});

console.log("Expired discount cleanup job scheduled to run every minute...");