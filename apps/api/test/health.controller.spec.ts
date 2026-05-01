import { Test } from '@nestjs/testing';
import { HealthController } from '../src/modules/health/health.controller';
import { ApiResponseInterceptor } from '../src/shared/api/api-response.interceptor';
import { of } from 'rxjs';

describe('HealthController', () => {
  it('returns basic health status', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });

  it('returns stubbed dependency status', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(controller.getDependencyHealth()).toEqual({
      status: 'stubbed',
      dependencies: {
        db: 'unknown',
        redis: 'unknown',
        objectStorage: 'unknown',
        search: 'unknown',
      },
    });
  });
});

describe('ApiResponseInterceptor', () => {
  it('wraps controller data in standard success envelope', (done) => {
    const interceptor = new ApiResponseInterceptor();
    const callHandler = { handle: () => of({ status: 'ok' }) } as any;

    interceptor.intercept({} as any, callHandler).subscribe((value) => {
      expect(value).toEqual({
        success: true,
        data: { status: 'ok' },
        meta: {},
      });
      done();
    });
  });
});

