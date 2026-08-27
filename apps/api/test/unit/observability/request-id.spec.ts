import {
  assignRequestId,
  isSafeRequestId,
  requestIdFrom,
} from '@api/core/observability/request-id';

describe('requestId', () => {
  it('preserva um identificador seguro recebido do cliente', () => {
    const request = { headers: { 'x-request-id': 'trace.checkout:123' } };
    const response = { setHeader: jest.fn() };

    expect(assignRequestId(request, response)).toBe('trace.checkout:123');
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'trace.checkout:123');
  });

  it('gera UUID quando o identificador recebido é inseguro', () => {
    const response = { setHeader: jest.fn() };
    const requestId = assignRequestId(
      { headers: { 'x-request-id': 'valor com espaços e quebra\nde linha' } },
      response,
    );

    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', requestId);
  });

  it('prioriza o identificador já atribuído pelo middleware', () => {
    expect(requestIdFrom({ headers: { 'x-request-id': 'header-id' }, id: 'middleware-id' })).toBe(
      'middleware-id',
    );
    expect(isSafeRequestId('a'.repeat(129))).toBe(false);
  });
});
