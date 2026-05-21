---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/loadAppsInTossAdMob.md
---

# 인앱 광고 2.0

![](/assets/iaa_flow.DLo6-e5F.webp)

## 광고 불러오기 (`loadAppsInTossAdMob`)

`loadAppsInTossAdMob`는 광고를 미리 불러오는 함수예요.\
광고가 필요한 시점에 바로 노출할 수 있도록 사전에 준비해요.

::: tip 안정적으로 운영하려면 이렇게 구현해 주세요

* 페이지(또는 화면) 단위로 광고를 미리 로드해 주세요.
* 광고는 반드시 **`load → show → (다음 load)`** 순서로 호출해 주세요.
* `loadAppsInTossAdMob` 호출 후 **이벤트를 받은 뒤** `showAppsInTossAdMob`를 호출해야 해요.
* 한 번에 하나의 광고만 로드할 수 있어요.
* 광고를 표시한 뒤에는 다음 광고를 미리 로드해 두는 패턴(`load → show → load → show`)을 권장해요.
  :::

::: tip iOS에서 로드되지 않나요?
iOS에서 광고가 로드되지 않는 경우 **앱 추적 모드(App Tracking Transparency)** 설정을 확인해 주세요.\
앱 추적이 허용되지 않은 상태에서는 일부 광고 로드가 정상 동작하지 않을 수 있어요.
:::

### 시그니처

```typescript
function loadAppsInTossAdMob(params: LoadAdMobParams): typeof noop;
```

### 파라미터

### 프로퍼티

### 예제

뷰 진입 시 광고 불러오기

::: code-group

```js [js]
import { GoogleAdMob } from '@apps-in-toss/web-framework';

const AD_GROUP_ID = '<AD_GROUP_ID>';

document.addEventListener('DOMContentLoaded', () => {
  if (GoogleAdMob.loadAppsInTossAdMob.isSupported() !== true) {
    return;
  }

  const cleanup = GoogleAdMob.loadAppsInTossAdMob({
    options: {
      adGroupId: AD_GROUP_ID,
    },
    onEvent: (event) => {
      console.log(event.type);
      switch (event.type) {
        case 'loaded':
          console.log('광고 로드 성공', event.data);
          adLoadStatus = 'loaded';
          statusText.textContent = '광고 로드 완료';
          cleanup();
          break;
      }
    },
    onError: (error) => {
      console.error('광고 불러오기 실패', error);
      cleanup?.();
    },
  });
});
```

```tsx [React]
import { GoogleAdMob } from '@apps-in-toss/web-framework';
import { Button, Text } from '@toss/tds-mobile';
import { useCallback, useState } from 'react';

const AD_GROUP_ID = '<AD_GROUP_ID>';

function GoogleAdmobExample() {
  const [adLoadStatus, setAdLoadStatus] = useState<'not_loaded' | 'loaded' | 'failed'>('not_loaded');
  const loadAd = useCallback(() => {
    if (GoogleAdMob.loadAppsInTossAdMob.isSupported() !== true) {
      return;
    }

    const cleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: {
        adGroupId: AD_GROUP_ID,
      },
      onEvent: (event) => {
        console.log(event.type);
        switch (event.type) {
          case 'loaded':
            console.log('광고 로드 성공', event.data);
            setAdLoadStatus('loaded');
            cleanup();
            break;
        }
      },
      onError: (error) => {
        console.error('광고 불러오기 실패', error);
        cleanup?.();
      },
    });
  }, []);

  return (
    <div>
      <Text>
        {adLoadStatus === 'not_loaded' && '광고 로드 하지 않음 '}
        {adLoadStatus === 'loaded' && '광고 로드 완료'}
        {adLoadStatus === 'failed' && '광고 로드 실패'}
      </Text>

      <Button title="Load Ad" onClick={loadAd}>
        광고 로드
      </Button>
    </div>
  );
}
```

```tsx [React Native]
import { GoogleAdMob } from '@apps-in-toss/framework';
import { useEffect } from 'react';
import { View, Text } from 'react-native';

const AD_GROUP_ID = '<AD_GROUP_ID>';

function GoogleAdmobExample() {
  useEffect(() => {
    if (GoogleAdMob.loadAppsInTossAdMob.isSupported() !== true) {
      return;
    }
    const cleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: {
        adGroupId: AD_GROUP_ID,
      },
      onEvent: (event) => {
        switch (event.type) {
          case 'loaded':
            console.log('광고 로드 성공', event.data);
            cleanup();
            break;
        }
      },
      onError: (error) => {
        console.error('광고 불러오기 실패', error);
        cleanup?.();
      },
    });
  }, []);

  return (
    <View>
      <Text>Page</Text>
    </View>
  );
}
```

:::

### `LoadAdMobParams`

`LoadAdMobParams` 는 광고를 불러오는 함수에 필요한 옵션 객체예요.

### 시그니처

```typescript
type LoadAdMobParams = AdMobHandlerParams<LoadAdMobOptions, LoadAdMobEvent>;
```

### `LoadAdMobEvent`

`LoadAdMobEvent` 는 광고를 불러오는 함수에서 발생하는 이벤트 타입이에요. `loaded` 이벤트가 발생하면 광고를 성공적으로 불러온 거예요.

### 시그니처

```typescript
type LoadAdMobEvent =
  | AdMobFullScreenEvent
  | {
      type: 'loaded';
    };
```

## 광고 보여주기 (`showAppsInTossAdMob`)

광고를 사용자에게 노출해요. 이 함수는 `loadAppsInTossAdMob` 로 미리 불러온 광고를 실제로 사용자에게 노출해요.

### 시그니처

```typescript
function showAppsInTossAdMob(params: ShowAdMobParams): typeof noop;
```

### 파라미터

### 프로퍼티

### 예제

버튼 눌러 불러온 광고 보여주기

::: code-group

```js [js]
import { GoogleAdMob } from '@apps-in-toss/web-framework';

const AD_GROUP_ID = '<AD_GROUP_ID>';

const showAdButton = document.getElementById('show-ad-button');
showAdButton.addEventListener('click', () => {
  const cleanup = GoogleAdMob.loadAppsInTossAdMob({
    options: {
      adGroupId: AD_GROUP_ID,
    },
    onEvent: (event) => {
      switch (event.type) {
        case 'loaded':
          console.log('광고 로드 성공', event.data);
          cleanup();
          GoogleAdMob.showAppsInTossAdMob({
            options: {
              adGroupId: AD_GROUP_ID,
            },
            onEvent: (event) => {
              switch (event.type) {
                case 'show':
                  console.log('광고 컨텐츠 보여졌음');
                  break;
                case 'requested':
                  console.log('광고 보여주기 요청 완료');
                  break;
                case 'impression':
                  console.log('광고 노출');
                  break;
                case 'clicked':
                  console.log('광고 클릭');
                  break;
                case 'userEarnedReward': // 보상형 광고만 사용 가능
                  console.log('광고 보상 획득 unitType:', event.data.unitType);
                  console.log('광고 보상 획득 unitAmount:', event.data.unitAmount);
                  break;
                case 'dismissed':
                  console.log('광고 닫힘');
                  break;
                case 'failedToShow':
                  console.log('광고 보여주기 실패');
                  break;
              }
            },
            onError: (error) => {
              console.error('광고 보여주기 실패', error);
            },
          });
          break;
      }
    },
    onError: (error) => {
      console.error('광고 불러오기 실패', error);
      cleanup?.();
    },
  });
});
```

```tsx [React]
import { GoogleAdMob } from '@apps-in-toss/web-framework';
import { Button, Text } from '@toss/tds-mobile';
import { useCallback, useState } from 'react';

const AD_GROUP_ID = '<AD_GROUP_ID>';

function GoogleAdmobExample() {
  const [adLoadStatus, setAdLoadStatus] = useState<'not_loaded' | 'loaded' | 'failed'>('not_loaded');

  const loadAd = useCallback(() => {
    if (GoogleAdMob.loadAppsInTossAdMob.isSupported() !== true) {
      return;
    }

    const cleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: {
        adGroupId: AD_GROUP_ID,
      },
      onEvent: (event) => {
        console.log(event.type);
        switch (event.type) {
          case 'loaded':
            console.log('광고 로드 성공', event.data);
            setAdLoadStatus('loaded');
            cleanup();
            break;
        }
      },
      onError: (error) => {
        console.error('광고 불러오기 실패', error);
        cleanup?.();
      },
    });
  }, []);

  const showAd = useCallback(() => {
    if (GoogleAdMob.showAppsInTossAdMob.isSupported() !== true) {
      return;
    }

    GoogleAdMob.showAppsInTossAdMob({
      options: {
        adGroupId: AD_GROUP_ID,
      },
      onEvent: (event) => {
        switch (event.type) {
          case 'show':
            console.log('광고 컨텐츠 보여졌음');
            break;
          case 'requested':
            console.log('광고 보여주기 요청 완료');
            setAdLoadStatus('not_loaded');
            break;
          case 'impression':
            console.log('광고 노출');
            break;
          case 'clicked':
            console.log('광고 클릭');
            break;
          case 'userEarnedReward': // 보상형 광고만 사용 가능
            console.log('광고 보상 획득 unitType:', event.data.unitType);
            console.log('광고 보상 획득 unitAmount:', event.data.unitAmount);
            break;
          case 'dismissed':
            console.log('광고 닫힘');
            break;
          case 'failedToShow':
            console.log('광고 보여주기 실패');
            break;
        }
      },
      onError: (error) => {
        console.error('광고 보여주기 실패', error);
      },
    });
  }, []);

  return (
    <div>
      <Text>
        {adLoadStatus === 'not_loaded' && '광고 로드 하지 않음 '}
        {adLoadStatus === 'loaded' && '광고 로드 완료'}
        {adLoadStatus === 'failed' && '광고 로드 실패'}
      </Text>

      <Button title="Load Ad" onClick={loadAd}>
        광고 로드
      </Button>
      <Button title="Show Ad" onClick={showAd} disabled={adLoadStatus !== 'loaded'}>
        광고 보여주기
      </Button>
    </div>
  );
}
```

```tsx [React Native]
import { GoogleAdMob } from '@apps-in-toss/framework';
import { useFocusEffect } from '@granite-js/native/@react-navigation/native';
import { useNavigation } from '@granite-js/react-native';
import { useCallback, useState } from 'react';
import { Button, Text, View } from 'react-native';

const AD_GROUP_ID = '<AD_GROUP_ID>';

export function GoogleAdmobExample() {
  const [adLoadStatus, setAdLoadStatus] = useState<'not_loaded' | 'loaded' | 'failed'>('not_loaded');
  const navigation = useNavigation();

  const loadAd = useCallback(() => {
    if (GoogleAdMob.loadAppsInTossAdMob.isSupported() !== true) {
      return;
    }

    const cleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: {
        adGroupId: AD_GROUP_ID,
      },
      onEvent: (event) => {
        switch (event.type) {
          case 'loaded':
            console.log('광고 로드 성공', event.data);
            setAdLoadStatus('loaded');
            cleanup();
            break;
        }
      },
      onError: (error) => {
        console.error('광고 불러오기 실패', error);
        cleanup?.();
      },
    });
  }, [navigation]);

  const showAd = useCallback(() => {
    if (GoogleAdMob.showAppsInTossAdMob.isSupported() !== true) {
      return;
    }

    GoogleAdMob.showAppsInTossAdMob({
      options: {
        adGroupId: AD_GROUP_ID,
      },
      onEvent: (event) => {
        switch (event.type) {
          case 'show':
            console.log('광고 컨텐츠 보여졌음');
            break;
          case 'requested':
            console.log('광고 보여주기 요청 완료');
            break;
          case 'impression':
            console.log('광고 노출');
            break;
          case 'clicked':
            console.log('광고 클릭');
            break;
          case 'userEarnedReward': // 보상형 광고만 사용 가능
            console.log('광고 보상 획득 unitType:', event.data.unitType);
            console.log('광고 보상 획득 unitAmount:', event.data.unitAmount);
            break;
          case 'dismissed':
            console.log('광고 닫힘');
            navigation.navigate('/examples/google-admob-interstitial-ad-landing');
            break;
          case 'failedToShow':
            console.log('광고 보여주기 실패');
            break;
        }
      },
      onError: (error) => {
        console.error('광고 보여주기 실패', error);
      },
    });
  }, []);

  useFocusEffect(loadAd);

  return (
    <View>
      <Text>
        {adLoadStatus === 'not_loaded' && '광고 로드 하지 않음 '}
        {adLoadStatus === 'loaded' && '광고 로드 완료'}
        {adLoadStatus === 'failed' && '광고 로드 실패'}
      </Text>

      <Button title="Show Ad" onPress={showAd} disabled={adLoadStatus !== 'loaded'} />
    </View>
  );
}
```

:::

### `ShowAdMobParams`

`ShowAdMobParams` 는 불러온 광고를 보여주는 함수에 필요한 옵션 객체예요.

### 시그니처

```typescript
type ShowAdMobParams = AdMobHandlerParams<ShowAdMobOptions, ShowAdMobEvent>;
```

### `ShowAdMobEvent`

`ShowAdMobEvent` 는 광고를 보여주는 함수에서 발생하는 이벤트 타입이에요. `requested` 이벤트가 발생하면 광고 노출 요청이 Google AdMob에 성공적으로 전달된 거예요.

### 시그니처

```typescript
type ShowAdMobEvent =
  | { type: 'requested' }
  | { type: 'clicked' }
  | { type: 'dismissed' }
  | { type: 'failedToShow' }
  | { type: 'impression' }
  | { type: 'show' }
  | {
      type: 'userEarnedReward'; // 보상형 광고만 사용 가능
      data: {
        unitType: string;
        unitAmount: number;
      };
    };
```
