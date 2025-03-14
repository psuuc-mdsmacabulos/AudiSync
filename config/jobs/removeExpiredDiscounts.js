import cron from "node-cron";
import { AppDataSource } from "../data-source.js";
import Discount from "../../dist/discounts.js";
import { LessThan } from "typeorm";

const removeExpiredDiscounts = async () => {
    try {
        const discountRepository = AppDataSource.getRepository(Discount);
        const now = new Date();

        const result = await discountRepository.delete({ end_date: LessThan(now) });

        console.log(`Expired discounts removed: ${result.affected}`);
    } catch (error) {
        console.error("Error removing expired discounts:", error);
    }
};

cron.schedule("0 16 * * *", () => {  
    console.log("🔄 Running expired discount cleanup...");
    removeExpiredDiscounts();
}, {
    scheduled: true,
    timezone: "Asia/Manila"  
});

console.log("Expired discount cleanup job scheduled...");
