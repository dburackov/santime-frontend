import { SearchableSelect } from './SearchableSelect';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Текст на кнопке, пока значение не соответствует ни одному из options. */
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
}

/** Простой одиночный селект в стиле SearchableSelect — без поиска и без чекбоксов/радио. */
export function Select({ options, value, onChange, placeholder = '', ariaLabel, id }: SelectProps) {
  return (
    <SearchableSelect
      id={id}
      options={options}
      selected={[value]}
      onChange={(values) => {
        if (values[0] !== undefined) onChange(values[0]);
      }}
      placeholder={options.find((option) => option.value === value)?.label ?? placeholder}
      searchable={false}
      showIndicator={false}
      allowClear={false}
      ariaLabel={ariaLabel}
    />
  );
}
