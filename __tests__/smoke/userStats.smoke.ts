import { createSmokeTestSuite } from "../utils/smokeTestRunner";
import { userStatsService } from "@/services/userStats";

export const userStatsSmokeTests = createSmokeTestSuite("User Stats Service")
  .addTest("Should initialize user stats with defaults", async () => {
    const userId = "smoke_test_user_" + Date.now();
    await userStatsService.initializeUser(userId);

    const stats = await userStatsService.getStats(userId);
    if (!stats) throw new Error("Stats should be initialized");
    if (stats.totalFollowers !== 0) throw new Error("Default followers should be 0");

    // Cleanup
    await userStatsService.resetUserData(userId);
  })

  .addTest("Should cache stats after save", async () => {
    const userId = "smoke_test_cache_" + Date.now();
    const stats = await userStatsService.getStats(userId) || {
      totalFollowers: 0,
      totalEngagement: 0,
      totalViews: 0,
      totalPosts: 0,
      postsCreated: 0,
      postsScheduled: 0,
      postsPublished: 0,
      postsDraft: 0,
      mediaUploaded: 0,
      platformsConnected: 0,
      teamMembers: 1,
      engagementRate: 0,
      growthRate: 0,
      lastUpdated: new Date().toISOString(),
    };

    stats.totalFollowers = 100;
    await userStatsService.saveStats(userId, stats);

    const cachedStats = await userStatsService.getStats(userId);
    if (!cachedStats) throw new Error("Stats not found");
    if (cachedStats.totalFollowers !== 100) throw new Error("Stats not updated");

    // Cleanup
    await userStatsService.resetUserData(userId);
  })

  .addTest("Should handle activities list", async () => {
    const userId = "smoke_test_activities_" + Date.now();

    await userStatsService.addActivity(userId, {
      type: "post_created",
      title: "Test Activity",
      description: "Testing activity creation",
    });

    const activities = await userStatsService.getActivities(userId);
    if (activities.length === 0) throw new Error("Activity not added");
    if (activities[0].title !== "Test Activity") throw new Error("Activity title mismatch");

    // Cleanup
    await userStatsService.resetUserData(userId);
  });

export async function runUserStatsSmoke(): Promise<void> {
  const results = await userStatsSmokeTests.run();
  console.log(JSON.stringify(results, null, 2));
}
