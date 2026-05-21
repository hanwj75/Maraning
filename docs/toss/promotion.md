---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/비게임/promotion.md
---

# 비게임 프로모션(토스 포인트)

::: tip 프로모션 기능
앱인토스의 프로모션은 **사용자의 특정 행동을 기준으로 토스 포인트를 지급하는 이벤트 기능**이에요.\
프로모션은 비즈 월렛에 충전한 예산으로 진행할 수 있으며, 혜택 탭 노출 여부를 콘솔에서 설정 할 수 있어요.\
[프로모션 기능 이해하기](/promotion/intro.md)\
[프로모션 기능 콘솔 가이드](/promotion/console.md)\
:::

비게임 카테고리 미니앱에서 프로모션을 통해 유저에게 토스 포인트를 지급하는 방법은 두 가지예요.

* **서버 없이 지급**: 별도의 서버 연동 없이 SDK 함수 호출만으로 포인트를 지급해요.
* **서버를 통해 지급**: 파트너사 서버에서 API를 직접 호출해 포인트를 지급해요.

***

## 서버 없이 프로모션 포인트 지급하기

### `grantPromotionReward`

별도의 서버 연동 없이도 **비게임 미니앱 내에서 유저에게 토스 포인트를 지급**하고, 혜택탭에 노출할 수 있어요.

::: tip 주의하세요

* **토스앱 5.232.0 버전 이상**에서 지원해요.
  해당 버전 미만에서는 `undefined`가 반환돼요.
  * 최소 버전 미만에서는 미니앱 진입 시 업데이트 안내 화면이 표시돼요.
* 프로모션 기능을 개발한 후, 실제 프로모션을 시작하기 전에 테스트용 프로모션 코드로 **최소 1회 이상** 호출해야 합니다.
  (테스트 호출을 통해 프로모션이 정상적으로 등록 및 승인 상태로 전환돼요.)
* 테스트 프로모션 코드는 샌드박스 앱이 아닌 **토스앱(QR 코드 테스트)** 에서 호출해야 합니다.\
  (샌드박스 환경에서는 정상적으로 반영되지 않을 수 있어요.)

:::

#### 시그니처

```typescript
function grantPromotionReward({
  params,
}: {
  params: {
    promotionCode: string;
    amount: number;
  };
}): Promise<GrantPromotionRewardResult>;
```

#### 파라미터

#### 반환 값

포인트 지급 결과를 반환해요.

* `{ key: string }`: 포인트 지급에 성공했어요. key는 리워드 키를 의미해요.
* `{ errorCode: string, message: string }`: 포인트 지급에 실패했어요. 에러 코드를 확인해 주세요.

#### 에러 코드

프로모션 함수 사용 중 발생할 수 있는 에러 코드 목록입니다.
응답 코드나 메시지를 참고해 **적절한 예외 처리 로직**을 적용해 주세요.

::: tip `4109` 에러가 발생한다면?

* 프로모션 예산의 **80% 소진이 이메일로 안내**가 발송돼요.
* 프로모션을 계속 진행하려면 **콘솔에서 예산을 증액**해 주세요.
* 예산이 부족할 경우, **비즈월렛에서 금액을 충전**해 예산을 늘릴 수 있어요.
* 예산이 모두 소진되면 프로모션이 **자동으로 종료되어 `4109` 에러가 발생**해요.
* 예산 부족으로 인해 포인트 지급이 실패하면 **사용자 CS 이슈로 이어질 수 있으니 주의**해 주세요.
  :::

| 코드        | 메시지                               | 발생 원인 / 대응 방법                                                          |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| `4100`      | 프로모션 정보를 찾을 수 없어요       | 콘솔에 등록되지 않은 프로모션 키로 호출한 경우                                 |
| `4109`      | 프로모션이 실행중이 아니에요         | 콘솔에서 프로모션을 시작하지 않았거나, 예산이 모두 소진되어 자동 종료된 경우   |
| `4110`      | 리워드를 지급/회수할 수 없어요       | 내부 시스템 오류 발생한 경우로, **재지급 로직**을 적용해 주세요.               |
| `4111`      | 리워드 지급내역을 찾을 수 없어요     | 존재하지 않은 지급 내역을 조회한 경우                                          |
| `4112`      | 프로모션 머니가 부족해요             | 예산 부족으로 지급이 실패한 경우로, 콘솔에서 예산 증액 또는 비즈월렛 충전 필요 |
| `4114`      | 1회 지급 금액을 초과했어요           |                                                                                |
| `4116`      | 최대 지급 금액이 예산을 초과했어요   |                                                                                |
| `ERROR`     | 알 수 없는 오류가 발생했어요.        |                                                                                |
| `undefined` | 앱 버전이 최소 지원 버전보다 낮아요. |                                                                                |

#### 예제

::: code-group

```js [js]
import { grantPromotionReward } from '@apps-in-toss/web-framework';

async function handleGrantPromotionReward() {
  const result = await grantPromotionReward({
    params: {
      promotionCode: 'EVENT_2024',
      amount: 1000,
    },
  });

  if (!result) {
    console.warn('지원하지 않는 앱 버전이에요.');
  } else if (result === 'ERROR') {
    console.error('포인트 지급 중 알 수 없는 오류가 발생했어요.');
  } else if ('key' in result) {
    console.log('포인트 지급 성공!', result.key);
  } else if ('errorCode' in result) {
    console.error('포인트 지급 실패:', result.errorCode, result.message);
  }
}
```

```tsx [React]
// webview
import { grantPromotionReward } from '@apps-in-toss/web-framework';

function GrantRewardButton() {
  async function handleClick() {
    const result = await grantPromotionReward({
      params: {
        promotionCode: 'EVENT_2024',
        amount: 1000,
      },
    });

    if (!result) {
      console.warn('지원하지 않는 앱 버전이에요.');
      return;
    }

    if (result === 'ERROR') {
      console.error('포인트 지급 중 알 수 없는 오류가 발생했어요.');
      return;
    }

    if ('key' in result) {
      console.log('포인트 지급 성공!', result.key);
    } else if ('errorCode' in result) {
      console.error('포인트 지급 실패:', result.errorCode, result.message);
    }
  }

  return <button onClick={handleClick}>포인트 지급하기</button>;
}
```

```tsx [React Native]
// react-native
import { Button } from 'react-native';
import { grantPromotionReward } from '@apps-in-toss/framework';

function GrantRewardButton() {
  async function handlePress() {
    const result = await grantPromotionReward({
      params: {
        promotionCode: 'EVENT_2024',
        amount: 1000,
      },
    });

    if (!result) {
      console.warn('지원하지 않는 앱 버전이에요.');
      return;
    }

    if (result === 'ERROR') {
      console.error('포인트 지급 중 알 수 없는 오류가 발생했어요.');
      return;
    }

    if ('key' in result) {
      console.log('포인트 지급 성공!', result.key);
    } else if ('errorCode' in result) {
      console.error('포인트 지급 실패:', result.errorCode, result.message);
    }
  }

  return <Button onPress={handlePress} title="포인트 지급하기" />;
}
```

:::

***

## 서버를 통해 프로모션 포인트 지급하기

파트너사 서버에서 직접 API를 호출해 유저에게 토스 포인트를 지급하는 방식이에요.

![](/assets/promotion_flow.Cv3ZwYVx.webp)

::: tip BaseURL
`https://apps-in-toss-api.toss.im`
:::

### ① 프로모션 리워드 지급 Key 생성하기

프로모션 지급을 위한 Key를 발급합니다.
이 Key를 사용해 유저에게 리워드를 지급할 수 있어요.

::: tip 주의해주세요

* 유저에게 리워드를 지급하는 주체는 파트너사예요.\
  발급받은 Key로 유저에게 리워드를 지급하면, **프로모션 예산 한도 내에서** 지속적으로 지급돼요.

* **1회 지급만 허용**하려면 파트너사에서 자체적으로 제어해야 해요.

* 이미 사용한 지급 Key로 다시 지급을 시도하면 `4113` 에러가 발생해요.
  추가 지급이 필요할 경우, **새로운 Key를 발급**해 주세요.

* 발급받은 **Key의 유효시간은 1시간**이에요.
  :::

* Content-type : application/json

* Method : `POST`

* Endpoint : `/api-partner/v1/apps-in-toss/promotion/execute-promotion/get-key`

**요청 헤더**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------------|------|
| x-toss-user-key | string | Y | 토스 로그인을 통해 획득한 userKey 값 |

**응답 파라미터**
| 이름 | 타입 | 설명 |
|------|------|------|
| key | String | 프로모션 지급을 위한 key 값  base64 인코딩된 값 |

```json
{
  "resultType": "SUCCESS",
  "success": {
    "key": "3oBpxjUgl5r66edcVi7ynHGIjhzr9KOka6FfEKikev0="
  }
}
```

### ② 프로모션 리워드 지급하기

발급받은 key로 **프로모션 리워드 지급을 실행**해요.
지급 시 프로모션 예산에서 차감되며, 실제 지급까지는 약간의 지연이 발생할 수 있어요.

* Content-type : application/json
* Method : `POST`
* Endpoint : `/api-partner/v1/apps-in-toss/promotion/execute-promotion`

**요청 헤더**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------------|------|
| x-toss-user-key | string | Y | 토스 로그인을 통해 획득한 userKey 값 |

**요청 파라미터**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| promotionCode | String | Y | 콘솔에서 생성한 프로모션 코드ID |
| key | String | Y | 프로모션 지급을 위해 발급받은 KEY값 |
| amount | Integer | Y | 프로모션 지급 금액 |

```json
{
  "promotionCode": "01JPPJ6SB66BQXXDAKRQZ6SZD7",
  "key": "3oBpxjUgl5r66edcVi7ynHGIjhzr9KOka6FfEKikev0=",
  "amount": 10
}
```

**응답 파라미터**
| 이름 | 타입 | 설명 |
|------|------|------|
| key | String | 프로모션 지급을 위해 발급받은 KEY값 |

```json
{
  "resultType": "SUCCESS",
  "success": {
    "key": "3oBpxjUgl5r66edcVi7ynHGIjhzr9KOka6FfEKikev0="
  }
}
```

### ③ 프로모션 지급 결과 조회하기

지급 요청 이후의 **프로모션 지급 상태를 조회**해요.

* Content-type : application/json
* Method : `POST`
* Endpoint : `/api-partner/v1/apps-in-toss/promotion/execution-result`

**요청 헤더**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------------|------|
| x-toss-user-key | string | Y | 토스 로그인을 통해 획득한 userKey 값 |

**요청 파라미터**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| promotionCode | String | Y | 콘솔에서 생성한 프로모션 코드ID |
| key | String | Y | 프로모션 지급을 위해 발급받은 KEY값 |

```json
{
  "promotionCode": "01JPPJ6SB66BQXXDAKRQZ6SZD7",
  "key": "3oBpxjUgl5r66edcVi7ynHGIjhzr9KOka6FfEKikev0="
}
```

**응답 파라미터**
| 이름 | 타입 | 설명 |
|------|------|------|
| success | String | 프로모션 지급 결과  - SUCCESS  - PENDING  - FAILED |

```json
{
  "resultType": "SUCCESS",
  "success": "PENDING"
}
```

### 에러 코드

프로모션 API 사용 중 발생할 수 있는 에러 코드 목록입니다.
응답 코드나 메시지를 참고해 **적절한 예외 처리 로직**을 적용해 주세요.

::: tip `4109` 에러가 발생한다면?

* 프로모션 예산의 **80% 소진이 이메일로 안내**가 발송돼요.
* 프로모션을 계속 진행하려면 **콘솔에서 예산을 증액**해 주세요.
* 예산이 부족할 경우, **비즈월렛에서 금액을 충전**해 예산을 늘릴 수 있어요.
* 예산이 모두 소진되면 프로모션이 **자동으로 종료되어 `4109` 에러가 발생**해요.
* 예산 부족으로 인해 포인트 지급이 실패하면 **사용자 CS 이슈로 이어질 수 있으니 주의**해 주세요.
  :::

| 코드   | 메시지                             | 발생 원인 / 대응 방법                                                          |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------ |
| `4100` | 프로모션 정보를 찾을 수 없어요     | 콘솔에 등록되지 않은 프로모션 키로 호출한 경우                                 |
| `4109` | 프로모션이 실행중이 아니에요       | 콘솔에서 프로모션을 시작하지 않았거나, 예산이 모두 소진되어 자동 종료된 경우   |
| `4110` | 리워드를 지급/회수할 수 없어요     | 내부 시스템 오류 발생한 경우로, **재지급 로직**을 적용해 주세요.               |
| `4111` | 리워드 지급내역을 찾을 수 없어요   | 존재하지 않은 지급 내역을 조회한 경우                                          |
| `4112` | 프로모션 머니가 부족해요           | 예산 부족으로 지급이 실패한 경우로, 콘솔에서 예산 증액 또는 비즈월렛 충전 필요 |
| `4113` | 이미 지급/회수된 내역이에요        | 동일한 Key로 중복 지급할 경우로, 새로운 Key를 발급해 재시도해주세요.           |
| `4114` | 1회 지급 금액을 초과했어요         |                                                                                |
| `4116` | 최대 지급 금액이 예산을 초과했어요 |                                                                                |
