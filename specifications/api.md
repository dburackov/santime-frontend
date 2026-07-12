# API документация — santime-backend

Базовый URL (локально): `http://localhost:8080`. Порт по умолчанию Spring Boot, `server.port` не переопределён.

Все пути начинаются с `/api`. Авторизации сейчас нет (`SecurityConfig` разрешает все запросы) — это добавится позже, фронт пока может ходить без токенов/сессий.

Формат тела запросов/ответов — `application/json`.

## Общий формат ошибок

Все ошибки возвращаются в едином виде (`ErrorResponse`):

```json
{
  "message": "Товар не найден: id=123",
  "errors": null
}
```

Для ошибок валидации (`400`) поле `errors` заполнено картой `поле -> сообщение`:

```json
{
  "message": "Ошибка валидации",
  "errors": {
    "name": "Название обязательно",
    "slug": "Slug обязателен"
  }
}
```

| Код | Когда |
|---|---|
| `400 Bad Request` | Невалидное тело запроса (`@Valid`) или бизнес-ошибка (`IllegalArgumentException`) — например, атрибут не привязан к категории, неверный тип значения |
| `404 Not Found` | Сущность не найдена по id/slug |
| `409 Conflict` | Нарушение уникальности (дублирующийся `slug`/`sku`) или конфликт бизнес-правила (например, изменение `is_filter` для NUMBER-атрибута, у которого уже создан индекс) |

## Пагинация

Каталожные и админские списки товаров возвращают единый конверт (`PageResponse<T>`):

```json
{
  "content": [ /* массив элементов */ ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3
}
```

`page` — с нуля. `/api/catalog/products` принимает `page`/`size` как обычные query-параметры. `/api/admin/products` использует Spring `Pageable` — те же `page`/`size`, плюс `sort=field,asc|desc` (можно несколько раз).

---

# 1. Публичное API каталога (для витрины)

Всё, что нужно фронту магазина: список категорий (дерево нужно собирать на фронте по `parentCategoryId`, см. раздел 2.1), список фильтров категории, список товаров-вариантов с фильтрами, детальная карточка варианта.

## 1.1. `GET /api/catalog/categories/{categoryId}/filters`

Список характеристик категории, помеченных как фильтруемые (`is_filter = true`), включая характеристики дочерних категорий. Используется для отрисовки панели фильтров.

**Ответ** — массив `CatalogFilterAttributeResponse`:

```json
[
  {
    "name": "Цвет",
    "slug": "color",
    "type": "OPTION",
    "unit": null,
    "options": [
      { "value": "black", "count": 2 },
      { "value": "white", "count": 1 }
    ],
    "minValue": null,
    "maxValue": null
  },
  {
    "name": "Оперативная память",
    "slug": "ram",
    "type": "NUMBER",
    "unit": "ГБ",
    "options": null,
    "minValue": 8,
    "maxValue": 12
  }
]
```

Компонент фильтра на фронте подбирается по `type`:

| `type` | UI |
|---|---|
| `STRING` | свободный текст (без `options`/`min`/`max` — п.3.1 ТЗ) |
| `NUMBER` | range-слайдер, границы — `minValue`/`maxValue` |
| `BOOLEAN` | чекбокс/переключатель, `options` = `[{value:"true",count}, {value:"false",count}]` |
| `OPTION` | список чекбоксов / select, значения — `options[].value`, `count` — фасетный счётчик |

`count` в `options` — количество **товаров** (не вариантов), у которых есть вариант с этим значением атрибута, с учётом активности товара, но **без учёта остальных выбранных фильтров** (не пересчитывается динамически).

## 1.2. `GET /api/catalog/products`

Список товаров каталога. **Одна строка результата = один вариант товара** (не товар с агрегированной ценой — см. раздел про UX ниже).

**Query-параметры:**

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `categoryId` | Long | — | фильтр по категории (включая всех потомков дерева категорий) |
| `brandId` | Long | — | фильтр по бренду |
| `priceMin` / `priceMax` | BigDecimal | — | диапазон цены варианта |
| `inStock` | boolean | `false` | только варианты с `stockQuantity > 0` |
| `sort` | `NAME_ASC` \| `NAME_DESC` \| `PRICE_ASC` \| `PRICE_DESC` | `NAME_ASC` | сортировка |
| `page` / `size` | int | `0` / `20` | пагинация |
| `<attributeSlug>` | string | — | equality-фильтр по значению атрибута (для STRING/OPTION/BOOLEAN), напр. `color=black`. Можно перечислить через запятую: `color=black,white` (логическое ИЛИ) |
| `<attributeSlug>_min` / `<attributeSlug>_max` | number | — | диапазонный фильтр для NUMBER-атрибута, напр. `ram_min=8&ram_max=16` |

Атрибутные фильтры (последние два пункта) работают **только вместе с `categoryId`** и только для атрибутов, у которых в этой категории `is_filter = true` — иначе `400`. Slug атрибута берётся из ответа `filters` (п. 1.1).

**Ответ** — `PageResponse<VariantCardResponse>`, элемент:

```json
{
  "variantId": 1,
  "variantSlug": "iphone-15-black",
  "productId": 1,
  "productName": "iPhone 15",
  "productSlug": "iphone-15",
  "categoryId": 1,
  "brandId": 1,
  "price": 89900.00,
  "inStock": true,
  "attributes": {
    "color": "black",
    "ram": 8,
    "screen_size": 6.1,
    "material": "алюминий",
    "waterproof": true
  }
}
```

`attributes` — **весь** набор атрибутов варианта (не только те, что участвуют в вариантах), специально — чтобы можно было рендерить каталог таблицей/списком с колонками характеристик (как на Onliner/5element), без похода за деталями каждого товара. Для плиточной раскладки просто не используйте лишние поля.

Пример: все товары категории 1, отфильтрованные по цвету, отсортированные по цене:
```
GET /api/catalog/products?categoryId=1&color=black&sort=PRICE_ASC
```

## 1.3. `GET /api/catalog/products/{variantSlug}`

Детальная карточка одного варианта — открывается по клику на элемент из п. 1.2 (используйте `variantSlug`, а не `variantId`, — это человекочитаемый URL для SEO).

**Ответ** — `VariantDetailResponse`:

```json
{
  "variantId": 1,
  "variantSlug": "iphone-15-black",
  "sku": "IPH15-BLK-128",
  "price": 89900.00,
  "stockQuantity": 15,
  "weightKg": 0.171,
  "attributes": {
    "color": "black",
    "ram": 8,
    "screen_size": 6.1,
    "material": "алюминий",
    "waterproof": true
  },
  "productId": 1,
  "productName": "iPhone 15",
  "productSlug": "iphone-15",
  "description": "Смартфон Apple iPhone 15",
  "categoryId": 1,
  "brandId": 1,
  "attributeMetadata": [
    { "name": "Цвет", "slug": "color", "type": "OPTION", "unit": null, "required": true },
    { "name": "Оперативная память", "slug": "ram", "type": "NUMBER", "unit": "ГБ", "required": true }
  ],
  "variantOptions": [
    {
      "attributeSlug": "color",
      "attributeName": "Цвет",
      "options": [
        { "variantId": 1, "variantSlug": "iphone-15-black", "value": "black", "current": true,  "inStock": true },
        { "variantId": 2, "variantSlug": "iphone-15-white", "value": "white", "current": false, "inStock": true }
      ]
    }
  ]
}
```

- `attributeMetadata` — упорядоченный (по `sortOrder`) список характеристик категории с их именем/типом/единицей измерения — для подписей в таблице характеристик на странице товара.
- `variantOptions` — по одной группе на каждый атрибут категории с `is_variant = true` (у вас это `color`). Именно отсюда рендерится строка "Цвета" со ссылками на другие варианты того же товара: `current` — это открытый сейчас вариант, `inStock` — есть ли он в наличии, `variantSlug` — куда вести ссылку.

---

# 2. Админское API (управление каталогом)

Всё под `/api/admin/...`. CRUD-паттерн одинаковый почти везде: `GET` (list), `GET /{id}` (one), `POST` (create, `201`), `PUT /{id}` (update, `200`), `DELETE /{id}` (`204`).

## 2.1. Категории — `/api/admin/categories`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/admin/categories?parentId={id}` | список категорий; `parentId` опционален — без него отдаются **все** категории плоским списком (дерево строится на фронте по `parentCategoryId`); с `parentId` — только прямые потомки |
| GET | `/api/admin/categories/{id}` | одна категория |
| POST | `/api/admin/categories` | создать |
| PUT | `/api/admin/categories/{id}` | обновить |
| DELETE | `/api/admin/categories/{id}` | удалить (каскадно потянет `product`, `category_attribute` — FK `ON DELETE CASCADE`) |

Тело запроса (`CategoryRequest`):
```json
{ "name": "Смартфоны", "slug": "smartfony", "parentCategoryId": null }
```

Ответ (`CategoryResponse`):
```json
{ "id": 1, "name": "Смартфоны", "slug": "smartfony", "parentCategoryId": null, "createdAt": "...", "updatedAt": "..." }
```

## 2.2. Бренды — `/api/admin/brands`

Тот же CRUD-паттерн (без `PUT`... нет, `PUT` тоже есть). Тело (`BrandRequest`): `{ "name": "Apple", "slug": "apple" }`. Ответ (`BrandResponse`) дополнительно содержит `id`, `createdAt`.

## 2.3. Атрибуты — `/api/admin/attributes`

Справочник характеристик (общий для всех категорий, привязка к категории — отдельная сущность, см. 2.5).

Тело (`AttributeRequest`):
```json
{ "name": "Оперативная память", "slug": "ram", "type": "NUMBER", "unit": "ГБ" }
```
`type` — одно из `STRING`, `NUMBER`, `BOOLEAN`, `OPTION` (`AttributeType`). `unit` опционален.

Ответ (`AttributeResponse`) — то же самое + `id`.

## 2.4. Значения OPTION-атрибута — `/api/admin/attributes/{attributeId}/options`

Только для атрибутов с `type = OPTION` (список допустимых значений, напр. цветов).

| Метод | Путь |
|---|---|
| GET | `/api/admin/attributes/{attributeId}/options` |
| POST | `/api/admin/attributes/{attributeId}/options` |
| PUT | `/api/admin/attributes/{attributeId}/options/{optionId}` |
| DELETE | `/api/admin/attributes/{attributeId}/options/{optionId}` |

Тело (`AttributeOptionRequest`): `{ "value": "black" }`. Ответ (`AttributeOptionResponse`): `{ "id": 1, "value": "black" }`.

## 2.5. Привязка атрибутов к категории — `/api/admin/categories/{categoryId}/attributes`

Здесь настраивается, какие атрибуты доступны в категории, обязательны ли, участвуют ли в фильтрах и в различении вариантов.

| Метод | Путь |
|---|---|
| GET | `/api/admin/categories/{categoryId}/attributes` |
| POST | `/api/admin/categories/{categoryId}/attributes` (создать привязку) |
| PUT | `/api/admin/categories/{categoryId}/attributes/{attributeId}` (изменить флаги) |
| DELETE | `/api/admin/categories/{categoryId}/attributes/{attributeId}` |

Тело создания (`CategoryAttributeRequest`):
```json
{ "attributeId": 2, "required": true, "isFilter": true, "isVariant": false, "sortOrder": 2 }
```
Тело обновления (`CategoryAttributeUpdateRequest`) — то же самое без `attributeId` (он в пути).

Ответ (`CategoryAttributeResponse`):
```json
{
  "attributeId": 2,
  "attributeName": "Оперативная память",
  "attributeSlug": "ram",
  "attributeType": "NUMBER",
  "required": true,
  "isFilter": true,
  "isVariant": false,
  "sortOrder": 2
}
```

При простановке `isFilter = true` для NUMBER-атрибута бэкенд асинхронно создаёт expression-индекс под этот атрибут — с точки зрения фронта это прозрачно, просто может занять время на очень больших таблицах.

## 2.6. Товары — `/api/admin/products`

| Метод | Путь | Query |
|---|---|---|
| GET | `/api/admin/products` | `categoryId` (опц.), `page`, `size`, `sort` |
| GET | `/api/admin/products/{id}` | |
| POST | `/api/admin/products` | |
| PUT | `/api/admin/products/{id}` | |
| DELETE | `/api/admin/products/{id}` | |

Тело (`ProductRequest`):
```json
{
  "name": "iPhone 15",
  "slug": "iphone-15",
  "description": "Смартфон Apple iPhone 15",
  "categoryId": 1,
  "brandId": 1,
  "active": true
}
```

Ответ (`ProductResponse`) — то же + `id`, `createdAt`, `updatedAt`. GET-список оборачивается в `PageResponse<ProductResponse>`.

Это карточка товара как таковая (название/описание/категория/бренд/активность) — цена, остаток и характеристики живут в вариантах (2.7), у товара их нет.

## 2.7. Варианты товара — `/api/admin/products/{productId}/variants`

| Метод | Путь |
|---|---|
| GET | `/api/admin/products/{productId}/variants` |
| GET | `/api/admin/products/{productId}/variants/{id}` |
| POST | `/api/admin/products/{productId}/variants` |
| PUT | `/api/admin/products/{productId}/variants/{id}` |
| DELETE | `/api/admin/products/{productId}/variants/{id}` |

Тело (`ProductVariantRequest`):
```json
{
  "slug": "iphone-15-black",
  "sku": "IPH15-BLK-128",
  "price": 89900.00,
  "stockQuantity": 15,
  "weightKg": 0.171,
  "attributes": {
    "color": "black",
    "ram": 8,
    "screen_size": 6.1,
    "material": "алюминий",
    "waterproof": true
  }
}
```

Важно:
- `slug` — задаётся вручную (как у `product`/`category`), должен быть глобально уникален (используется в публичном URL `/api/catalog/products/{slug}`, см. 1.3). Рекомендуемый формат — `<product-slug>-<различающий-атрибут>`, напр. `iphone-15-black`.
- `attributes` — ключи должны быть слагами атрибутов, привязанных к категории товара (`category_attribute`, см. 2.5), иначе `400`. Обязательные (`required=true`) атрибуты должны присутствовать, тип значения должен соответствовать `attribute.type`, значения `OPTION`-атрибутов — быть из списка `attribute_option`.

Ответ (`ProductVariantResponse`) — то же + `id`, `productId`, `createdAt`, `updatedAt`.

---

# 3. Типичные сценарии фронта

**Страница категории:**
1. `GET /api/catalog/categories/{id}/filters` — построить панель фильтров.
2. `GET /api/catalog/products?categoryId={id}&...` — список товаров с учётом выбранных фильтров/сортировки/страницы.

**Страница товара:**
1. Переход по `variantSlug` из карточки списка → `GET /api/catalog/products/{variantSlug}`.
2. Рендер характеристик из `attributeMetadata` + `attributes`.
3. Рендер селектора вариантов (напр. цветов) из `variantOptions`.

**Дерево категорий в шапке/меню:**
`GET /api/admin/categories` без `parentId` → плоский список, собрать дерево на фронте по `parentCategoryId`. (Отдельного публичного эндпоинта для дерева категорий пока нет — категории отдаются только через admin-путь.)