---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱
  결제/IAP.md
---

# 인앱 결제

소모품, 비소모품처럼 한 번 구매로 완료되는 상품에 사용하는 일회성 결제 SDK예요.

![](/assets/iap_flow_1.D-R365GQ.webp)

![](/assets/iap_flow_2.Bam-KXld.webp)

::: tip BaseURL
`https://apps-in-toss-api.toss.im`
:::

연동 흐름은 아래 순서를 따라 주세요.

1. [상품 목록 가져오기](#getproductitemlist) — `getProductItemList`
2. [결제 요청하기](#createonetimepurchaseorder) — `createOneTimePurchaseOrder`
3. [미결 주문 복원하기](#getpendingorders) — `getPendingOrders`, `completeProductGrant`
4. [주문 상태 조회하기](#getcompletedorrefundedorders) — `getCompletedOrRefundedOrders` 또는 [주문 상태 조회 API](#주문-상태-조회-api)

::: tip 주의하세요

* SDK **1.1.3 버전 이상**을 사용해주세요.
  * SDK 1.1.3 버전부터는 **상품 지급 완료 과정**이 추가되어 함수 인터페이스가 변경되었어요.
* SDK **1.2.2 버전**부터는 **구매 복원 기능**이 추가되었어요.
* **사용자의 기기가 변경되더라도 인앱결제 상품이 지급 유지될 수 있도록 반드시 연동해주세요.**
  * [네이티브 저장소 기능](/bedrock/reference/framework/저장소/Storage.md)을 활용해 주세요.
  * 토스 로그인 연동과 인앱결제 상태 조회 API를 활용해 주세요.
* 인앱결제 상태 조회 API 사용을 위해서는 반드시 [토스 로그인 연동](/login/intro.md)을 먼저 진행해 주세요.
  :::

***

## IAP 객체

`IAP`는 인앱 결제 관련 함수를 모아둔 객체예요.

::: tip 주의하세요

토스앱 5.219.0 버전부터 지원해요. 인앱 결제를 지원하지 않는 버전에서는 `undefined`를 반환해요.

:::

### 시그니처

```typescript
IAP {
  getProductItemList: typeof getProductItemList;
  createOneTimePurchaseOrder: typeof createOneTimePurchaseOrder;
  getPendingOrders: typeof getPendingOrders;
  getCompletedOrRefundedOrders: typeof getCompletedOrRefundedOrders;
  completeProductGrant: typeof completeProductGrant;
}
```

### 프로퍼티

## 상품 목록 조회하기(`getProductItemList`) {#getproductitemlist}

`getProductItemList` 는 인앱 결제로 구매할 수 있는 상품 목록을 담은 함수예요. 상품 목록을 화면에 표시할 때 사용해요.

### 시그니처

```typescript
function getProductItemList(): Promise<{ products: IapProductListItem[] } | undefined>;
```

### 반환값

### 프로퍼티

```typescript
interface IapProductListItem {
  sku: string;
  displayAmount: string;
  displayName: string;
  iconUrl: string;
  description: string;
}
```

### 예제

구매 가능한 인앱결제 상품목록 가져오기

::: code-group

```js [js]
import { IAP } from '@apps-in-toss/web-framework';

async function handleGetProductItemList() {
  const response = await IAP.getProductItemList();

  return response?.products ?? [];
}
```

```tsx [React]
import { IAP, IapProductListItem } from '@apps-in-toss/web-framework';
import { Button, List, ListRow } from '@toss/tds-mobile';
import { useEffect, useState, useCallback } from 'react';

function IapProductList() {
  const [products, setProducts] = useState<IapProductListItem[]>([]);

  const handleBuy = useCallback(() => {
    const cleanup = IAP.createOneTimePurchaseOrder({
      options: {
        sku,
        processProductGrant: ({ orderId }) => {
          // 상품 지급 로직을 작성해요.
          return true; // 상품 지급 여부를 반환해요.
        },
      },
      onEvent: (event) => {
        console.log(event);

        if (event.type === 'success') {
          cleanup();
        }
      },
      onError: (error) => {
        console.error(error);
        cleanup();
      },
    });
  }, [sku]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await IAP.getProductItemList();
        setProducts(response?.products ?? []);
      } catch (error) {
        console.error('상품 목록을 가져오는 데 실패했어요:', error);
      }
    }

    fetchProducts();
  }, []);

  return (
    <List>
      {products.map((product) => (
        <ListRow
          key={product.sku}
          left={<ListRow.Image type="square" src={product.iconUrl} />}
          contents={
            <ListRow.Texts
              type="3RowTypeA"
              top={product.displayName}
              middle={product.description}
              bottom={product.displayAmount}
            />
          }
          right={
            <Button size="medium" onClick={() => handleBuy(product.sku)}>
              구매하기
            </Button>
          }
        />
      ))}
    </List>
  );
}
```

```tsx [React Native]
import { IAP, IapProductListItem } from '@apps-in-toss/framework';
import { Button, List, ListRow } from '@toss/tds-react-native';
import { useEffect, useState, useCallback } from 'react';

function IapProductList() {
  const [products, setProducts] = useState<IapProductListItem[]>([]);

  const handleBuy = useCallback(() => {
    const cleanup = IAP.createOneTimePurchaseOrder({
      options: {
        sku,
        processProductGrant: ({ orderId }) => {
          // 상품 지급 로직을 작성해요.
          return true; // 상품 지급 여부를 반환해요.
        },
      },
      onEvent: (event) => {
        console.log(event);

        if (event.type === 'success') {
          cleanup();
        }
      },
      onError: (error) => {
        console.error(error);
        cleanup();
      },
    });
  }, [sku]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await IAP.getProductItemList();
        setProducts(response?.products ?? []);
      } catch (error) {
        console.error('상품 목록을 가져오는 데 실패했어요:', error);
      }
    }

    fetchProducts();
  }, []);

  return (
    <List>
      {products.map((product) => (
        <ListRow
          key={product.sku}
          left={<ListRow.Image type="square" source={{ uri: product.iconUrl }} />}
          right={
            <Button size="medium" onPress={() => handleBuy(product.sku)}>
              구매하기
            </Button>
          }
          contents={
            <ListRow.Texts
              type="3RowTypeA"
              top={product.displayName}
              middle={product.description}
              bottom={product.displayAmount}
            />
          }
        />
      ))}
    </List>
  );
}
```

:::

### 예제 응답

```json
{
  "products": [
    {
      "sku": "sku1",
      "displayName": "광고 제거",
      "displayAmount": "4,900원",
      "iconUrl": "https://cdn.example.com/icons/premium-monthly.png",
      "description": "광고 제거 및 프리미엄 기능 제공"
    },
    {
      "sku": "sku2",
      "displayName": "코인 100개",
      "displayAmount": "9,900원",
      "iconUrl": "https://cdn.example.com/icons/coin-100.png",
      "description": "앱 내에서 사용할 수 있는 코인 100개"
    }
  ]
}
```

### 예제 앱 체험하기

[apps-in-toss-examples](https://github.com/toss/apps-in-toss-examples) 저장소에서 [with-in-app-purchase](https://github.com/toss/apps-in-toss-examples/tree/main/with-in-app-purchase) 코드를 내려받아 체험해 보세요.

## 일회성 결제 요청하기(`createOneTimePurchaseOrder`) {#createonetimepurchaseorder}

`createOneTimePurchaseOrder` 함수는 인앱 결제 결제창을 띄우고, 사용자가 결제를 진행해요. 만약 결제 중에 에러가 발생하면 에러 유형에 따라 에러 페이지로 이동해요.

:::tip 참고하세요
결제 성공 후 30초내에 `processProductGrant` 콜백이 호출되지 않거나 해당 콜백의 결과가 true가 아닌 경우,\
`{appName}에 문제가 생겼어요. 환불을 신청해주세요` 페이지가 노출될 수 있어요.
:::

### 시그니처

```typescript
function createOneTimePurchaseOrder(params: IapCreateOneTimePurchaseOrderOptions): () => void;
```

### 파라미터

```typescript
interface IapCreateOneTimePurchaseOrderOptions {
  options: { sku: string; processProductGrant: (params: { orderId: string }) => boolean | Promise<boolean> };
  onEvent: (event: SuccessEvent) => void | Promise<void>;
  onError: (error: unknown) => void | Promise<void>;
}

interface IapCreateOneTimePurchaseOrderResult {
  orderId: string;
  displayName: string;
  displayAmount: string;
  amount: number;
  currency: string;
  fraction: number;
  miniAppIconUrl: string | null;
}

interface SuccessEvent {
  type: 'success';
  data: IapCreateOneTimePurchaseOrderResult;
}
```

### 에러코드

### 반환값

### 예제

특정 인앱결제 주문서 페이지로 이동하기

::: code-group

```js [js]
import { IAP } from '@apps-in-toss/web-framework';

let cleanup;

function handleBuyProduct(sku) {
  cleanup = IAP.createOneTimePurchaseOrder({
    options: {
      sku,
      processProductGrant: ({ orderId }) => {
        console.log('상품 지급 로직 실행:', orderId);
        return true;
      },
    },
    onEvent: (event) => {
      console.log('이벤트:', event);
      cleanup?.();
    },
    onError: (error) => {
      console.error('인앱결제에 실패했어요:', error);
      cleanup?.();
    },
  });
}

window.addEventListener('pagehide', () => {
  cleanup?.();
});
```

```tsx [React]
import { IAP } from '@apps-in-toss/web-framework';
import { Button } from '@toss/tds-mobile';
import { useCallback } from 'react';

interface Props {
  sku: string;
}

function IapCreateOneTimePurchaseOrderButton({ sku }: Props) {
  const handleBuy = useCallback(() => {
    const cleanup = IAP.createOneTimePurchaseOrder({
      options: {
        sku,
        processProductGrant: ({ orderId }) => {
          // 상품 지급 로직을 작성해요.
          return true; // 상품 지급 여부를 반환해요.
        },
      },
      onEvent: (event) => {
        console.log(event);
        cleanup();
      },
      onError: (error) => {
        console.error(error);
        cleanup();
      },
    });
  }, [sku]);

  return <Button onClick={handleBuy}>구매하기</Button>;
}
```

```tsx [React Native]
import { IAP } from '@apps-in-toss/framework';
import { Button } from '@toss/tds-react-native';
import { useCallback } from 'react';

interface Props {
  sku: string;
}

function IapCreateOneTimePurchaseOrderButton({ sku }: Props) {
  const handleClick = useCallback(() => {
    const cleanup = IAP.createOneTimePurchaseOrder({
      options: {
        sku,
        processProductGrant: ({ orderId }) => {
          // 상품 지급 로직을 작성해요.
          return true; // 상품 지급 여부를 반환해요.
        },
      },
      onEvent: (event) => {
        console.log(event);
        cleanup();
      },
      onError: (error) => {
        console.error(error);
        cleanup();
      },
    });
  }, []);

  return <Button onPress={handleClick}>구매하기</Button>;
}
```

:::

### 예제 앱 체험하기

[apps-in-toss-examples](https://github.com/toss/apps-in-toss-examples) 저장소에서 [with-in-app-purchase](https://github.com/toss/apps-in-toss-examples/tree/main/with-in-app-purchase) 코드를 내려받아 체험해 보세요.

## 미결 주문 조회하기(`getPendingOrders`) {#getpendingorders}

`getPendingOrders` 는 **결제는 완료되었지만 상품이 아직 지급되지 않은 주문 목록**을 가져오는 함수예요.\
조회된 주문 정보를 확인하여 사용자에게 상품을 지급하세요.\
`createOneTimePurchaseOrder` 함수 호출 후 결과를 받지 못한 경우에도 해당 주문을 조회할 수 있어요.

앱 버전이 최소 지원 버전(안드로이드 5.234.0, iOS 5.231.0)보다 낮으면 `undefined`를 반환해요.

### 시그니처

```typescript
function getPendingOrders(): Promise<{ orders: Order[] } | undefined>;
```

### 반환값

### 반환 객체 프로퍼티

```tsx
interface Order {
  orderId: string;
  sku: string;
  paymentCompletedDate?: string;
}
```

::: tip 필드 업데이트 안내

* **SDK 1.4.2**: sku 필드가 추가되었어요.
  이 필드는 **안드로이드 5.234.0 이상, iOS 5.231.0 이상**에서만 반환돼요.
* **SDK 1.4.8**: paymentCompletedDate 필드가 추가되었어요.
  결제 완료 시점을 확인할 수 있어요.
  :::

### 예제

::: code-group

```js [js]
import { IAP } from '@apps-in-toss/web-framework';

async function fetchOrders() {
  try {
    const pendingOrders = await IAP.getPendingOrders();
    return pendingOrders;
  } catch (error) {
    console.error(error);
  }
}
```

```tsx [React]
import { IAP } from '@apps-in-toss/web-framework';

async function fetchOrders() {
  try {
    const pendingOrders = await IAP.getPendingOrders();
    return pendingOrders;
  } catch (error) {
    console.error(error);
  }
}
```

```tsx [React Native]
import { IAP } from '@apps-in-toss/framework';

async function fetchOrders() {
  try {
    const pendingOrders = await IAP.getPendingOrders();
    return pendingOrders;
  } catch (error) {
    console.error(error);
  }
}
```

:::

## 상품 지급 완료 처리하기(`completeProductGrant`) {#completeproductgrant}

`completeProductGrant` 함수는 **대기 중인 주문의 상품 지급을 완료 처리하는 함수**예요.\
사용자에게 상품을 지급하고 `completeProductGrant` 함수를 호출하여 지급 상태를 완료로 변경하세요.

앱 버전이 최소 지원 버전(안드로이드 5.231.0, iOS 5.231.0)보다 낮으면 `undefined`를 반환해요.

### 시그니처

```typescript
function completeProductGrant(params: {
  params: {
    orderId: string;
  };
}): Promise<boolean | undefined>;
```

### 파라미터

### 반환값

### 예제

::: code-group

```js [js]
import { IAP } from '@apps-in-toss/web-framework';

async function handleCompleteProductGrant(orderId) {
  try {
    await IAP.completeProductGrant({ params: { orderId } });
  } catch (error) {
    console.error(error);
  }
}
```

```tsx [React]
import { IAP } from '@apps-in-toss/web-framework';

async function handleCompleteProductGrant(orderId: string) {
  try {
    await IAP.completeProductGrant({ params: { orderId } });
  } catch (error) {
    console.error(error);
  }
}
```

```tsx [React Native]
import { IAP } from '@apps-in-toss/framework';

async function handleCompleteProductGrant(orderId: string) {
  try {
    await IAP.completeProductGrant({ params: { orderId } });
  } catch (error) {
    console.error(error);
  }
}
```

:::

## 완료·환불 주문 조회하기(`getCompletedOrRefundedOrders`) {#getcompletedorrefundedorders}

`getCompletedOrRefundedOrders` 는 인앱결제로 구매하고 환불한 주문 목록을 가져와요.\
인앱결제 결제 및 상품 지급이 완료된 주문건와 환불된 주문건을 조회할 수 있어요.

결제는 완료되었지만 상품이 아직 지급되지 않은 주문건은 조회되지 않아요.\
[`getPendingOrders`](/bedrock/reference/framework/인앱%20결제/getPendingOrders)함수를 통해 `orderId`를 조회하여 사용자에게 상품을 지급한 후 [`completeProductGrant`](/bedrock/reference/framework/인앱%20결제/completeProductGrant)함수를 통해 상품 지급을 완료 처리하세요.

앱 버전이 최소 지원 버전(안드로이드 5.231.0, iOS 5.231.0)보다 낮으면 `undefined`를 반환해요.

::: tip 페이지네이션

* **한 페이지당 최대 50개** 의 주문이 반환돼요.
* 다음 페이지가 있을 때는 `hasNext`가 `true`이며, 응답의 `nextKey`를 다음 호출의 `key` 파라미터로 전달해 이어서 조회하세요.
  :::

### 시그니처

```typescript
function getCompletedOrRefundedOrders(params?: {
  key?: string | null;
}): Promise<CompletedOrRefundedOrdersResult | undefined>;
```

### 반환값

### 반환 객체 프로퍼티

```tsx
interface CompletedOrRefundedOrdersResult {
  hasNext: boolean;
  nextKey?: string | null;
  orders: {
    orderId: string;
    sku: string;
    status: 'COMPLETED' | 'REFUNDED';
    date: string;
  }[];
}
```

### 예제

::: code-group

```js [js]
import { IAP } from '@apps-in-toss/web-framework';

async function fetchOrders() {
  try {
    const orders = await IAP.getCompletedOrRefundedOrders();
    return orders;
  } catch (error) {
    console.error(error);
  }
}
```

```tsx [React]
import { IAP } from '@apps-in-toss/web-framework';

async function fetchOrders() {
  try {
    const orders = await IAP.getCompletedOrRefundedOrders();
    return orders;
  } catch (error) {
    console.error(error);
  }
}
```

```tsx [React Native]
import { IAP } from '@apps-in-toss/framework';

async function fetchOrders() {
  try {
    const orders = await IAP.getCompletedOrRefundedOrders();
    return orders;
  } catch (error) {
    console.error(error);
  }
}
```

:::

***

## 주문 상태 조회 API

서버에서 API로 인앱결제 주문 상태를 직접 조회할 수 있어요.\
승인 혹은 환불 응답을 받지 못한 경우에도 사용할 수 있어요.

::: tip 참고하세요
결제 상태 조회 API 사용을 위해서는 [토스 로그인 연동](/login/intro.md)을 먼저 진행해 주세요.
:::

* Content-type: `application/json`
* Method: `POST`
* URL: `/api-partner/v1/apps-in-toss/order/get-order-status`

### 요청 헤더

| 이름            | 타입   | 필수값 여부 | 설명                                 |
| --------------- | ------ | ----------- | ------------------------------------ |
| x-toss-user-key | string | N           | 토스 로그인으로 획득한 userKey 값 |

* 헤더를 포함하지 않으면 모든 주문 건이 응답돼요.
* 헤더에 `x-toss-user-key` 값을 포함하면 해당 userKey의 주문 건만 응답돼요.

### 요청 파라미터

| 이름    | 타입   | 필수 | 설명                                  |
| ------- | ------ | ---- | ------------------------------------- |
| orderId | String | Y    | 결제 생성 후 취득한 주문번호(uuid v7) |

```json
{
  "orderId": "13c9a1ff-2baa-4495-bbfa-a0826ba8c7c0"
}
```

### 응답

| 이름               | 타입   | 설명                                                                                      |
| ------------------ | ------ | ----------------------------------------------------------------------------------------- |
| orderId            | String | 요청한 주문번호                                                                           |
| sku                | String | 주문한 상품 ID                                                                            |
| statusDeterminedAt | String | 주문 완료 일시 (yyyy-MM-dd'T'HH:mm:ssZ)  `status`가 `REFUNDED`일 경우 환불 완료 일시 |
| status             | String | 주문에 대한 상태 (enum)                                                                   |
| reason             | String | 상태에 대한 설명                                                                          |

**status (enum)**

| 상태              | 설명         | 상세 설명                                                      |
| ----------------- | ------------ | -------------------------------------------------------------- |
| PURCHASED         | 주문 완료    | 인앱 결제 및 상품 지급이 모두 완료된 상태                      |
| PAYMENT\_COMPLETED | 결제 완료    | SDK 1.1.3 이상에서 결제는 완료되었으나 상품 지급이 실패한 상태 |
| FAILED            | 주문 실패    | 결제가 실패한 경우                                             |
| REFUNDED          | 주문 환불됨  | 환불 완료된 경우                                               |
| ORDER\_IN\_PROGRESS | 주문 진행 중 | 주문이 생성되었지만 결제/지급 처리가 완료되지 않은 경우        |
| NOT\_FOUND         | 주문 없음    | 해당 주문번호를 찾을 수 없는 경우                              |
| MINIAPP\_MISMATCH  | 상품 불일치  | 주문한 상품이 해당 앱의 상품이 아닌 경우                       |
| ERROR             | 내부 오류    | 시스템 내부 오류 발생 시                                       |

### 응답 예제

```json
{
  "resultType": "SUCCESS",
  "success": {
    "orderId": "13c9a1ff-2baa-4495-bbfa-a0826ba8c7c0",
    "sku": "ait.0000010000.af647449.3bd55cfd00.0000000475",
    "statusDeterminedAt": "2025-09-12T16:57:12",
    "status": "PAYMENT_COMPLETED",
    "reason": "결제가 완료되었어요."
  }
}
```

```json
{
  "resultType": "SUCCESS",
  "success": {
    "orderId": "13c9a1ff-2baa-4495-bbfa-0000000000",
    "sku": "ait.0000010000.af647449.00000000000.0000000475",
    "statusDeterminedAt": "2025-09-12T16:57:12",
    "status": "PURCHASED",
    "reason": "완료된 주문이에요."
  }
}
```
