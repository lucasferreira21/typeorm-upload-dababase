import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    try {
      const transactionsRepository = getCustomRepository(
        TransactionsRepository,
      );

      await transactionsRepository.delete(id);
    } catch (error) {
      throw new AppError('Error to delete transaction', 400);
    }
  }
}

export default DeleteTransactionService;
