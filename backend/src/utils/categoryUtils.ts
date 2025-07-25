interface CategoryRule {
  pattern: RegExp;
  category: string;
}

interface PaymentTypeRule {
  pattern: RegExp;
  paymentType: 'debit' | 'credit' | 'cash';
}

const categoryRules: CategoryRule[] = [
  // Food and Groceries
  { pattern: /WOOLIES|ALDI|COLES|RITCHIES|BUTCHERS?|HENRY'S|TULLY'S|FRUIT AND VEG/i, category: 'Groceries' },
  { pattern: /SUSHI|CATERING|KENNY'S|CAFE|RESTAURANT|FOOD|BAKERY/i, category: 'Food and Drink' },
  { pattern: /LIQUOR|LIQUORLAND|DAN MURPHY|BWS/i, category: 'Alcohol' },

  // Transport and Auto
  { pattern: /RACV|AUTOPAY|FUEL|PETROL|SERVICE|PARKING|TOLL/i, category: 'Transport' },
  
  // Utilities and Services
  { pattern: /SUPERLOOP|TELSTRA|OPTUS|VODAFONE|NBN|INTERNET|MOBILE/i, category: 'Internet and Phone' },
  { pattern: /INSURANCE|MEDIBANK|BUPA|HCF|NIB/i, category: 'Insurance' },
  { pattern: /ELECTRICITY|GAS|WATER|ORIGIN|AGL|ENERGY/i, category: 'Utilities' },

  // Shopping and Retail
  { pattern: /TARGET|KMART|BIG W|MYER|DAVID JONES|CLOTHING|FOOTWEAR/i, category: 'Clothing and Footwear' },
  { pattern: /BUNNINGS|HARDWARE|GARDEN|PLANTS/i, category: 'Garden and Hardware' },
  
  // Education and Professional
  { pattern: /SCHOOL|EDUCATION|COURSE|TRAINING|BRAINMATES/i, category: 'Education' },
  { pattern: /LINKEDIN|MICROSOFT|ADOBE|SOFTWARE|LICENSE/i, category: 'Software and Subscriptions' },

  // Financial
  { pattern: /LOAN|MORTGAGE|HELENA LOAN/i, category: 'Mortgage Payments' },
  { pattern: /CREDIT CARD|CARD PAYMENT|AMEX|MASTERCARD|VISA/i, category: 'Credit Card Payment' },
  { pattern: /RENT|RENTAL|BLAXLAND/i, category: 'Rent' },
  { pattern: /SALARY|WAGE|PAYROLL|COMMISSION/i, category: 'Salary' },

  // Entertainment
  { pattern: /NETFLIX|SPOTIFY|DISNEY|AMAZON|PRIME|STREAMING/i, category: 'Entertainment' },
  { pattern: /CINEMA|MOVIE|THEATRE|CONCERT|EVENT|TICKET/i, category: 'Entertainment' },

  // Health and Medical
  { pattern: /PHARMACY|CHEMIST|MEDICAL|DENTAL|DOCTOR|HOSPITAL/i, category: 'Health' },
  { pattern: /GYM|FITNESS|SPORT|EXERCISE/i, category: 'Health and Fitness' }
];

const paymentTypeRules: PaymentTypeRule[] = [
  // Credit Card indicators
  { 
    pattern: /AMEX|AMERICAN EXPRESS|CREDIT CARD|MASTERCARD|VISA|DINERS|CC PMT|CREDITCARD/i, 
    paymentType: 'credit' 
  },
  // Cash indicators
  { 
    pattern: /ATM|CASH OUT|WITHDRAWAL|MONEY EXCHANGE|CASH ADVANCE/i, 
    paymentType: 'cash' 
  },
  // Common debit transactions (default will be debit if no match)
  { 
    pattern: /EFTPOS|DEBIT|DIRECT DEBIT|BANK TRANSFER|BPAY|AUTOPAY|PAYPAL/i, 
    paymentType: 'debit' 
  }
];

export function categorizeTransaction(merchantName: string): string {
  // Default category if no rules match
  const defaultCategory = 'Uncategorized';
  
  if (!merchantName) {
    return defaultCategory;
  }

  // Find the first matching rule
  const matchingRule = categoryRules.find(rule => rule.pattern.test(merchantName));
  
  return matchingRule ? matchingRule.category : defaultCategory;
}

export function detectPaymentType(merchantName: string, description?: string): 'debit' | 'credit' | 'cash' {
  // Default payment type if no rules match
  const defaultPaymentType = 'debit';
  
  if (!merchantName && !description) {
    return defaultPaymentType;
  }

  const textToMatch = `${merchantName} ${description || ''}`.trim();
  
  // Find the first matching rule
  const matchingRule = paymentTypeRules.find(rule => rule.pattern.test(textToMatch));
  
  return matchingRule ? matchingRule.paymentType : defaultPaymentType;
}

// Export rules for testing and maintenance
export const getCategoryRules = () => categoryRules;
export const getPaymentTypeRules = () => paymentTypeRules; 