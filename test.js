const { contentService } = require('./features/content/service.js');
const { contentRepository } = require('./features/content/repository.js');
const { ok } = require('./core/result.js');

const originalGetAll = contentRepository.getAll;
contentRepository.getAll = async () => {
  return Promise.resolve(ok([
    { id: "1", status: "draft" },
    { id: "2", status: "draft" },
    { id: "3", status: "published" },
    { id: "4", status: "scheduled" },
    { id: "5", status: "failed" },
  ]));
};

contentService.getStats().then(statsResult => {
  if (statsResult.data) {
    console.log("Test stats:", statsResult.data);
  } else {
    console.error("Test error:", statsResult.error);
  }
});

contentRepository.getAll = originalGetAll;
