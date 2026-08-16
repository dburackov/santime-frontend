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
  /** Открывать панель в портале — см. SearchableSelect. Используется в модалках админки. */
  portal?: boolean;
  /** Строка поиска в панели — включать для длинных списков (категории, атрибуты, бренды). */
  searchable?: boolean;
  searchPlaceholder?: string;
}

/** Простой одиночный селект в стиле SearchableSelect — без чекбоксов/радио. */
export function Select({
  options,
  value,
  onChange,
  placeholder = '',
  ariaLabel,
  id,
  portal,
  searchable = false,
  searchPlaceholder,
}: SelectProps) {
  return (
    <SearchableSelect
      id={id}
      options={options}
      selected={[value]}
      onChange={(values) => {
        if (values[0] !== undefined) onChange(values[0]);
      }}
      placeholder={options.find((option) => option.value === value)?.label ?? placeholder}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      showIndicator={false}
      allowClear={false}
      ariaLabel={ariaLabel}
      portal={portal}
    />
  );
}
