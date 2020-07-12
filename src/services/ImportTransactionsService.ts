import { getCustomRepository, getRepository, In } from 'typeorm';
import fs from 'fs';
import csvParse from 'csv-parse';
import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface TransactionCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const categories: string[] = [];
    const transactions: TransactionCSV[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      categories.push(category);
      transactions.push({ title, type, value: Number(value), category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
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

    const createTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: categoriesRepository.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createTransactions);

    return createTransactions;
  }
}

export default ImportTransactionsService;
