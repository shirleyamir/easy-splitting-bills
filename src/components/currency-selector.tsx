import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const currencies: Currency[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
];

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currencyCode: string) => void;
}

export const CurrencySelector = ({ selectedCurrency, onCurrencyChange }: CurrencySelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <span className="font-mono">{currency.symbol}</span>
                <span>{currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = currencies.find(c => c.code === currencyCode);
  if (!currency) return amount.toFixed(2);

  // Special formatting for different currencies
  if (currencyCode === 'IDR') {
    // Indonesian Rupiah - no decimals, thousands separator
    return `${currency.symbol} ${Math.round(amount).toLocaleString('id-ID')}`;
  } else if (currencyCode === 'JPY') {
    // Japanese Yen - no decimals
    return `${currency.symbol}${Math.round(amount).toLocaleString()}`;
  } else {
    // Most other currencies - 2 decimal places
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
};