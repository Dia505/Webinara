const cron = require("node-cron");
const Webinar = require("../model/webinar");
const Host = require("../model/host");

cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();

    const pastWebinars = await Webinar.find({ date: { $lt: now } });

    for (const webinar of pastWebinars) {
      await Webinar.findByIdAndDelete(webinar._id);
      await Host.findByIdAndDelete(webinar.hostId);
    }

    console.log(`[CRON] Deleted ${pastWebinars.length} past webinars and their hosts.`);
  } catch (error) {
    console.error("[CRON] Error cleaning up past webinars:", error);
  }
});
