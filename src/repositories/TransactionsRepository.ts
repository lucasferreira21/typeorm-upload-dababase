import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsIncome = await this.find({
      where: { type: 'income' },
    });

    const transactionsOutcome = await this.find({
      where: { type: 'outcome' },
    });

    const income = transactionsIncome.reduce(
      (accumulator, currentValue) => accumulator + Number(currentValue.value),
      0,
    );
    const outcome = transactionsOutcome.reduce(
      (accumulator, currentValue) => accumulator + Number(currentValue.value),
      0,
    );
    const total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
