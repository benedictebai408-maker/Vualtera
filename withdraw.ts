import express from 'express';
import { prisma } from '../db';
const router = express.Router();

router.post('/initiate', async (req, res) => {
  try {
    const { userId, walletId, amountCents, recipientAddress, currency } = req.body;
    if (!userId || !walletId || !amountCents || !recipientAddress) return res.status(400).json({ error: 'missing' });
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) return res.status(404).json({ error: 'wallet not found' });
    if (BigInt(wallet.availableBalanceBigint) < BigInt(amountCents)) return res.status(400).json({ error: 'insufficient' });
    const tx = await prisma.transaction.create({ data: { userId, walletId, amountBigint: BigInt(amountCents), currency: currency || wallet.currency, status: 'pending', metadata: { flow: 'binance_withdrawal', beneficiary: { address: recipientAddress } } } });
    const newAvailable = BigInt(wallet.availableBalanceBigint) - BigInt(amountCents);
    await prisma.wallet.update({ where: { id: walletId }, data: { availableBalanceBigint: newAvailable } });
    return res.json({ ok: true, txId: tx.id, message: 'Withdrawal requested; admin approval required.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed' });
  }
});

export default router;
