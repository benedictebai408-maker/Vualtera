import express from 'express';
import bodyParser from 'body-parser';
import depositRouter from './routes_binance/deposit';
import webhookRouter from './routes_binance/webhook';
import withdrawRouter from './routes_binance/withdraw';
import adminRouter from './routes_admin';
import paystackDeposit from './routes_paystack/deposit'; // optional if exists
const app = express();
app.use(bodyParser.json());
app.use('/api/binance/deposit', depositRouter);
app.use('/api/binance/webhook', webhookRouter);
app.use('/api/binance/withdraw', withdrawRouter);
app.use('/api/admin', adminRouter);
// basic health
app.get('/api/status', (req,res)=>res.json({status:'ok', service:'vaultara-backend'}));
const port = process.env.PORT || 4000;
app.listen(port, ()=> console.log('Vaultara backend listening on', port));
