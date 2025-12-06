import express from 'express';
import { prisma } from '../db';
import { initBinancePayOrder } from './adapter_binance';
const router = express.Router();

router.post('/initiate', async (req, res) => {
  try {
    const { userId, amountCents, currency, returnUrl } = req.body;
    if (!userId || !amountCents) return res.status(400).json({ error: 'missing' });
    const tx = await prisma.transaction.create({ data: { userId, amountBigint: BigInt(amountCents), currency: currency || 'USDT', status: 'pending', metadata: { flow: 'binance_deposit' } } });
    const order = await initBinancePayOrder({ amount: amountCents, currency, orderId: tx.id, returnUrl });
    await prisma.transaction.update({ where: { id: tx.id }, data: { externalId: order.orderRef } });
    return res.json({ approvalUrl: order.approvalUrl, txId: tx.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'init failed' });
  }
});

export default router;
