import { CARS, assetValue } from './assets';
import { HOUSING, OFFERS, macroFor } from './config';
import type { DifficultyId, GameState, Plan } from './types';
import { roundMoney } from './utils';

export const debt = (state: GameState) =>
  state.loans.reduce((total, loan) => total + loan.balance, 0);

export const capital = (state: GameState) =>
  roundMoney(
    state.cash +
      state.savings +
      state.fund +
      assetValue(state) -
      debt(state) +
      state.pending.reduce((total, pending) => total + Math.min(0, pending.cash || 0), 0),
  );

export const essential = (
  plan: Plan,
  month: number,
  difficulty: DifficultyId = 'balance',
  state?: GameState,
) => {
  const housing = HOUSING.find((x) => x.id === plan.housing) || HOUSING[0];
  const transport = state?.car ? CARS[state.car.model].monthly : housing.transport;
  return Math.round(
    (housing.cost + transport + 8500 + 900) * macroFor(month, difficulty).inflation,
  );
};

export function annuity(amount: number, rate: number, months: number) {
  const monthlyRate = rate / 1200;
  return roundMoney(
    monthlyRate === 0
      ? amount / months
      : (amount * monthlyRate) / (1 - (1 + monthlyRate) ** -months),
  );
}

export function creditQuote(amount: number, offerId: string) {
  const offer = OFFERS.find((x) => x.id === offerId) || OFFERS[0];
  const payment = annuity(amount, offer.rate, offer.term);
  return {
    ...offer,
    payment: roundMoney(payment + offer.monthlyFee),
    total: roundMoney(payment * offer.term + offer.fee + offer.monthlyFee * offer.term),
    overpay: roundMoney(payment * offer.term + offer.fee + offer.monthlyFee * offer.term - amount),
  };
}
