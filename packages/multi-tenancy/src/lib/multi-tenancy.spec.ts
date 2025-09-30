import { multiTenancy } from './multi-tenancy';

describe('multiTenancy', () => {
  it('should work', () => {
    expect(multiTenancy()).toEqual('multi-tenancy');
  });
});
