import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    const validatesTotal = type === 'outcome' && total - value < 0 ? 1 : 0;

    if (validatesTotal) {
      throw new AppError('Value unavailable at the cashier', 400);
    }

    const categoryRepository = getRepository(Category);

    let categoryFind: Category;

    const findCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!findCategory) {
      const categoryCreate = categoryRepository.create({
        title: category,
      });

      categoryFind = await categoryRepository.save(categoryCreate);
    } else {
      categoryFind = findCategory;
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category: categoryFind,
    });

    await transactionsRepository.save(transaction);

    delete transaction.category_id;
    return transaction;
  }
}

export default CreateTransactionService;
