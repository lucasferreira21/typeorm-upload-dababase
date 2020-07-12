import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import loadCSV from '../utils/loadCSV';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const data = await loadCSV(filePath);

    const categories: string[] = [];

    const transactions = data.map(item => {
      const [title, type, value, category] = item;

      categories.push(category);

      return { title, type, value: Number(value), category };
    });

    const newCategories = categories.filter(
      (este, i) => categories.indexOf(este) === i,
    );

    const categoryRepository = getRepository(Category);

    const findCategory = await categoryRepository.find({
      where: In(newCategories),
    });

    const newCategory = newCategories.filter(item => {
      return !findCategory.find(category => category.title === item);
    });

    const categoryCreate = categoryRepository.create(
      newCategory.map(item => {
        return { title: item };
      }),
    );

    await categoryRepository.save(categoryCreate);

    const categoriesRepository = await categoryRepository.find();

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = transactionsRepository.create(
      transactions.map(item => {
        return {
          title: item.title,
          type: item.type,
          value: item.value,
          category: categoriesRepository.find(
            category => category.title === item.category,
          ),
        };
      }),
    );

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default ImportTransactionsService;
