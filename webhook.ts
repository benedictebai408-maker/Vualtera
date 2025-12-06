import express from 'express';
import { prisma } from '../db';
const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const body = JSON.parse(req.body.toString());
    const ref = body.orderRef || body.data?.orderRef || body.reference;
    if (!ref) return res.status(400).end('no ref');
    const tx = await prisma.transaction.findFirst({ where: { externalId: ref } });
    if (!tx) return res.status(404).end('tx not found');
    if (tx.status !== 'pending') return res.status(200).end();
    const wallet = await prisma.wallet.findFirst({ where: { userId: tx.userId } });
    if (!wallet) return res.status(404).end('wallet not found');
    const amount = BigInt(tx.amountBigint || 0);
    await prisma.$transaction(async (t) => {
      await t.transaction.update({ where: { id: tx.id }, data: { status: 'succeeded', completedAt: new Date() } });
      const newLedger = BigInt(wallet.ledgerBalanceBigint) + amount;
      await t.ledgerEntry.create({ data: { entryRef: `bin_${tx.id}`, walletId: wallet.id, amountBigint: amount, balanceAfter: newLedger, entryType: 'credit', source: 'binance', metadata: { txId: tx.id } } });
      await t.wallet.update({ where: { id: wallet.id }, data: { ledgerBalanceBigint: newLedger, availableBalanceBigint: newLedger } });
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('webhook', err);
    return res.status(500).end();
  }
});

export default router;
