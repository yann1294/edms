import { Test } from '@nestjs/testing';
import { WorkerModule } from '../src/worker.module';

describe('WorkerModule', () => {
  it('compiles', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [WorkerModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});

