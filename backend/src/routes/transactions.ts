import express, { Response } from 'express';
import { protect } from '../middleware/auth';
import Transaction from '../models/Transaction';
import Joi from 'joi';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { categorizeTransaction, detectPaymentType } from '../utils/categoryUtils';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

// Validation schema
const transactionSchema = Joi.object({
  amount: Joi.number().required(),
  description: Joi.string().required(),
  category: Joi.string().required(),
  type: Joi.string().valid('income', 'expense').required(),
  date: Joi.date().required(),
  recurring: Joi.boolean().default(false),
  frequency: Joi.string().valid('weekly', 'fortnightly', 'monthly', 'yearly', 'once').optional(),
  paymentType: Joi.string().valid('debit', 'credit', 'cash').default('debit')
});

// Get monthly transactions
router.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Convert month/year to date range with timezone handling
    const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));

    console.log('Fetching transactions with params:', {
      userId: req.user?._id,
      startDate,
      endDate,
      month,
      year
    });

    const transactions = await Transaction.find({
      userId: req.user!._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });

    console.log('Found transactions:', transactions);

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching monthly transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user!._id })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  try {
    const { error } = transactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const transaction = await Transaction.create({
      ...req.body,
      userId: req.user!._id,
      source: 'manual'
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transaction
router.put('/:id', async (req, res) => {
  try {
    const { error } = transactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to parse DD/MM/YYYY date
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  try {
    const [day, month, year] = dateStr.trim().split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date;
  } catch (error) {
    console.error('Date parse error:', error);
    return null;
  }
};

// Helper function to clean amount string
const parseAmount = (amountStr: string): number | null => {
  if (!amountStr) return null;
  try {
    // Remove quotes, spaces, and any currency symbols
    const cleaned = amountStr.replace(/["'$\s]/g, '');
    return parseFloat(cleaned);
  } catch (error) {
    console.error('Amount parse error:', error);
    return null;
  }
};

// Helper function to clean merchant name
const cleanMerchant = (merchant: string): string => {
  if (!merchant) return 'Imported Transaction';
  try {
    // Remove multiple spaces and trim
    return merchant.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Merchant clean error:', error);
    return 'Imported Transaction';
  }
};

// Bulk upload transactions via CSV
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results: any[] = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      delimiter: ','
    });

    // Parse CSV data
    parser.on('readable', function() {
      let record;
      while ((record = parser.read())) {
        results.push(record);
      }
    });

    // Handle parsing completion
    parser.on('end', async () => {
      try {
        console.log('Raw CSV records:', results);

        const transactions = results.map(row => {
          const date = parseDate(row.date);
          const amount = parseAmount(row.amount);
          const merchant = cleanMerchant(row.merchant);

          console.log('Processing row:', {
            original: row,
            parsed: { date, amount, merchant }
          });

          if (!date || amount === null) {
            console.log('Skipping invalid row:', row);
            return null;
          }

          // Auto-categorize based on merchant name
          const category = categorizeTransaction(merchant);
          
          // Detect payment type based on merchant name and any additional description
          const paymentType = detectPaymentType(merchant, row.description);

          return {
            userId: req.user!._id,
            date: date,
            amount: Math.abs(amount),
            description: merchant,
            type: amount < 0 ? 'expense' : 'income',
            category: category,
            source: 'csv_import',
            isAutomated: false,
            recurring: false,
            paymentType: paymentType
          };
        });

        const validTransactions = transactions.filter(t => t !== null);

        if (validTransactions.length === 0) {
          return res.status(400).json({
            message: 'No valid transactions found in CSV. Please ensure dates are in DD/MM/YYYY format and amounts are numbers.'
          });
        }

        await Transaction.insertMany(validTransactions);

        res.json({
          message: `Successfully imported ${validTransactions.length} transactions`,
          total: results.length,
          imported: validTransactions.length,
          skipped: results.length - validTransactions.length
        });
      } catch (error) {
        console.error('Error processing transactions:', error);
        res.status(500).json({ message: 'Error processing transactions' });
      }
    });

    // Handle parsing errors
    parser.on('error', (error) => {
      console.error('CSV parsing error:', error);
      res.status(400).json({ message: 'Error parsing CSV file' });
    });

    // Feed the file buffer to the parser
    const buffer = req.file.buffer;
    const stream = Readable.from(buffer.toString());
    stream.pipe(parser);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 