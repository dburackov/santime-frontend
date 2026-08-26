import './CurrencySymbol.css';

/* Контур знака белорусского рубля, снятый с nbrb.ttf (глиф лежал в приватной
   области, U+E901). Рисуем его сами, а не шрифтом: приватный код не значит
   ничего ни для парсеров, ни для буфера обмена, а при неудачной загрузке
   шрифта вместо знака появлялся квадрат. Официальный код U+20C5 подставить
   нельзя — он выйдет только в Unicode 19.0 (2027), сейчас его нет ни в одном
   системном шрифте. До тех пор текстовый слой — «Br».
   viewBox = bbox глифа (945×1170 при upem 2048), поэтому em-размеры и
   выравнивание по базовой линии повторяют шрифтовые метрики один в один. */
const GLYPH_PATH =
  'M1047 344Q1043 197 939 100Q835 3 680 0L397 0L268 0L268 280L102 280L102 410L268 410L268 1170L918 1170L918 1040L397 1040L397 688L680 688Q835 684 939 587Q1043 490 1047 344ZM397 411L694 411L694 279L397 279L397 129L681 129Q782 131 850 193Q917 253 920 344Q917 436 849.5 497Q782 558 681 560L539 560L397 560Z';

export function CurrencySymbol({ className }: { className?: string }) {
  return (
    <span className={`currency-symbol ${className ?? ''}`} role="img" aria-label="белорусский рубль">
      <svg
        className="currency-symbol__glyph"
        viewBox="102 -1170 945 1170"
        aria-hidden="true"
        focusable="false"
      >
        <path d={GLYPH_PATH} transform="scale(1,-1)" fill="currentColor" />
      </svg>
      <span className="visually-hidden">Br</span>
    </span>
  );
}
