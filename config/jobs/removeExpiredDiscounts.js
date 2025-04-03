import cron from "node-cron";
import { AppDataSource } from "../data-source.js";
import Discount from "../../dist/discounts.js";
import { LessThan } from "typeorm";

// Function to update the status of expired discounts
const updateExpiredDiscountsStatus = async () => {
    try {
        // Check if the database connection is initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("Database connection initialized for discount status update.");
        }

        const discountRepository = AppDataSource.getRepository(Discount);
        const now = new Date();
        const nowISO = now.toISOString();

        console.log(`Starting status update of expired discounts at ${nowISO}...`);

        // Update discounts where end_date is less than the current time and status is active
        const result = await discountRepository
            .createQueryBuilder()
            .update(Discount)
            .set({ status: "inactive" })
            .where("end_date < :now", { now })
            .andWhere("status = :status", { status: "active" })
            .andWhere("end_date IS NOT NULL")
            .execute();

        if (result.affected > 0) {
            console.log(`Successfully updated ${result.affected} expired discounts to inactive at ${nowISO}.`);
        } else {
            console.log(`No expired discounts found to update at ${nowISO}.`);
        }
    } catch (error) {
        console.error(`Error updating expired discounts status at ${new Date().toISOString()}:`, {
            message: error.message,
            stack: error.stack,
        });
    }
};

// Schedule the status update to run every minute
cron.schedule("*/1 * * * *", () => {
    console.log(`🔄 Running expired discount status update at ${new Date().toISOString()}...`);
    updateExpiredDiscountsStatus();
}, {
    scheduled: true,
    timezone: "Asia/Manila"
});

console.log("Expired discount status update job scheduled to run every minute...");