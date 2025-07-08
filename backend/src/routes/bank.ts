import express from 'express';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Mock Plaid integration - in production, use actual Plaid API
// Create link token for Plaid Link
router.post('/create-link-token', authMiddleware, async (req: any, res: any) => {
  try {
    // In production, use Plaid client to create link token
    const mockLinkToken = 'link-development-' + Math.random().toString(36).substr(2, 9);
    
    res.json({
      link_token: mockLinkToken,
      expiration: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });
  } catch (error) {
    console.error('Create link token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Exchange public token for access token
router.post('/exchange-public-token', authMiddleware, async (req: any, res: any) => {
  try {
    const { public_token } = req.body;
    
    // In production, exchange with Plaid
    const mockAccessToken = 'access-development-' + Math.random().toString(36).substr(2, 9);
    
    res.json({
      access_token: mockAccessToken,
      item_id: 'item-' + Math.random().toString(36).substr(2, 9)
    });
  } catch (error) {
    console.error('Exchange token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accounts
router.get('/accounts', authMiddleware, async (req: any, res: any) => {
  try {
    // Mock account data
    const mockAccounts = [
      {
        account_id: 'acc_1',
        name: 'Checking Account',
        type: 'depository',
        subtype: 'checking',
        balances: {
          available: 2500.50,
          current: 2500.50
        }
      },
      {
        account_id: 'acc_2',
        name: 'Savings Account',
        type: 'depository',
        subtype: 'savings',
        balances: {
          available: 10000.00,
          current: 10000.00
        }
      }
    ];
    
    res.json(mockAccounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transactions
router.get('/transactions', authMiddleware, async (req: any, res: any) => {
  try {
    // Mock transaction data
    const mockTransactions = [
      {
        transaction_id: 'txn_1',
        account_id: 'acc_1',
        amount: -45.50,
        date: '2024-01-15',
        merchant_name: 'Coffee Shop',
        category: ['Food and Drink', 'Restaurants', 'Coffee Shop']
      },
      {
        transaction_id: 'txn_2',
        account_id: 'acc_1',
        amount: 2500.00,
        date: '2024-01-01',
        merchant_name: 'Salary Deposit',
        category: ['Deposit', 'Payroll']
      }
    ];
    
    res.json(mockTransactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;