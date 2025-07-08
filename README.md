# Budget Planner

A comprehensive budgeting application that allows users to set monthly budgets based on income and expenses, model future scenarios, and connect with banks for automated transaction categorization.

## Features

- **Monthly Budget Creation**: Set up detailed budgets with income and expense categories
- **Future Modeling**: Project your finances into the future with customizable scenarios
- **Scenario Comparison**: Create and compare different financial scenarios
- **Bank Integration**: Connect with financial institutions to automate expense categorization
- **Transaction Tracking**: Monitor all your financial transactions in one place
- **Beautiful UI**: Modern, responsive design built with React and Tailwind CSS

## Tech Stack

### Backend
- Node.js with Express.js
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- Plaid API for bank integration
- Joi for validation

### Frontend
- React 18 with TypeScript
- React Router for navigation
- React Query for state management
- Tailwind CSS for styling
- Chart.js for data visualization
- Lucide React for icons

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd budget-planner
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration:
   - Set your MongoDB connection string
   - Add a secure JWT secret
   - Configure Plaid credentials (optional)

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

5. **Open your browser**
   Navigate to `http://localhost:3000` to access the application.

## Project Structure

```
budget-planner/
├── backend/
│   ├── src/
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Authentication middleware
│   │   └── server.ts       # Express server setup
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main app component
│   │   └── index.tsx       # Entry point
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
└── package.json            # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create new budget
- `GET /api/budgets/:id` - Get budget by ID
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Transactions
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction

### Scenarios
- `GET /api/scenarios` - Get scenarios
- `POST /api/scenarios` - Create scenario
- `POST /api/scenarios/compare` - Compare scenarios

### Bank Integration
- `POST /api/bank/create-link-token` - Create Plaid link token
- `POST /api/bank/exchange-public-token` - Exchange public token
- `GET /api/bank/accounts` - Get bank accounts
- `GET /api/bank/transactions` - Get bank transactions

## Database Models

### User
- email, password, firstName, lastName
- Encrypted passwords with bcrypt
- JWT token authentication

### Budget
- Monthly budgets with income/expense categories
- Automatic calculation of totals and net income
- User association

### Transaction
- Individual financial transactions
- Category assignment and automation support
- Bank integration via Plaid

### Scenario
- Budget modeling and future projections
- Comparison capabilities
- Configurable projection periods

## Features in Detail

### Budget Management
- Create monthly budgets with custom categories
- Separate income and expense tracking
- Real-time calculation of net income
- Edit and update existing budgets

### Scenario Modeling
- Project budgets into the future
- Create multiple scenarios for comparison
- Visualize financial outcomes
- Adjust parameters and see immediate results

### Bank Integration
- Connect multiple bank accounts
- Automatic transaction import
- Smart categorization of expenses
- Real-time balance updates

### Transaction Tracking
- Manual transaction entry
- Automated bank transaction sync
- Category-based organization
- Export capabilities

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production
```bash
npm run build
```

### Linting and Formatting
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@budgetplanner.com or open an issue on GitHub.

## Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics and insights
- [ ] Investment tracking
- [ ] Goal setting and progress tracking
- [ ] Multi-currency support
- [ ] Shared budgets for families
- [ ] Integration with more financial institutions
- [ ] AI-powered expense categorization
- [ ] Budget recommendations and insights