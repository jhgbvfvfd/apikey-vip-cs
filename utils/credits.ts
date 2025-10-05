import { Agent } from '../types';

type CreditCarrier = Pick<Agent, 'credits'> & Partial<Pick<Agent, 'unlimitedCredits'>>;

export const hasUnlimitedCredits = (entity?: CreditCarrier | null): boolean =>
  entity?.unlimitedCredits === true;

export const formatCredits = (entity: CreditCarrier, locale: string = 'th-TH'): string =>
  hasUnlimitedCredits(entity) ? 'ไม่จำกัด' : entity.credits.toLocaleString(locale);

export const canAffordCredits = (entity: CreditCarrier, amount: number): boolean =>
  hasUnlimitedCredits(entity) || entity.credits >= amount;
