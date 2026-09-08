const express = require("express");
const prisma = require("../services/db");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();
router.use(requireAdmin);

function deriveStatus(currentStep) {
  if (currentStep === "DONE") return "COMPLETED";
  if (currentStep === "CANCELLED") return "DECLINED";
  if (!currentStep) return "NOT_STARTED";
  return "IN_PROGRESS";
}

router.get("/responses", async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 25, 1), 100);

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { session: true },
    }),
    prisma.user.count(),
  ]);

  const responses = rows.map((row) => ({
    ...row,
    session: undefined,
    status: deriveStatus(row.session?.currentStep),
  }));

  res.json({ responses, total, page, pageSize });
});

router.get("/responses/:phoneNumber", async (req, res) => {
  const { phoneNumber } = req.params;

  const user = await prisma.user.findUnique({
    where: { phoneNumber },
    include: { session: true, conversationLogs: { orderBy: { createdAt: "asc" } } },
  });

  if (!user) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({
    ...user,
    session: undefined,
    status: deriveStatus(user.session?.currentStep),
  });
});

module.exports = router;
