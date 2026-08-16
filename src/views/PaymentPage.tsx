import './InfoPage.css';

export function PaymentPage() {
  return (
    <div className="container info-page">
      <h1 className="info-page__title">Оплата</h1>

      <section className="info-page__section">
        <h2>Способы оплаты</h2>
        <ul className="info-page__list">
          <li>
            <strong>Наличными или картой при получении</strong> — оплата в белорусских рублях (BYN) курьеру, в том
            числе банковской картой через мобильный терминал, с выдачей кассового чека
          </li>
          <li>
            <strong>Онлайн-оплата (E-POS)</strong> — оплата банковской картой при оформлении заказа через систему
            E-POS
          </li>
        </ul>
      </section>

      <section className="info-page__section">
        <h2>Преимущества</h2>
        <ul className="info-page__list">
          <li>Проверка товара перед оплатой при расчёте с курьером</li>
          <li>Мгновенное подтверждение оплаты</li>
          <li>Без комиссии и дополнительных платежей</li>
          <li>Все курьеры оснащены терминалами для бесконтактной оплаты</li>
        </ul>
      </section>
    </div>
  );
}
