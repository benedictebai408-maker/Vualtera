import express from 'express';
import { prisma } from './db';
import axios from 'axios';
const router = express.Router();

// list pending withdrawals
router.get('/withdrawals', async (req, res) => {
  const withdraws = await prisma.transaction.findMany({ where: { status: 'pending' } });
  res.json({ withdrawals: withdraws });
});

// approve withdrawal - calls Binance adapter (placeholder)
router.post('/withdrawals/approve', async (req, res) => {
  try {
    const { txId } = req.body;
    const tx = await prisma.transaction.findUnique({ where: { id: txId } });
    if (!tx) return res.status(404).json({ error: 'tx not found' });
    if (tx.status !== 'pending') return res.status(400).json({ error: 'tx not pending' });
    // In production: call Binance payout API here. We'll simulate by marking processing.
    await prisma.transaction.update({ where: { id: txId }, data: { status: 'processing' } });
    return res.json({ ok: true, message: 'withdrawal set to processing (adapter required)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

export default router;
