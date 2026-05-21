---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/분석/referrer.md
description: 미니앱으로 유입될 때 전달되는 appsintoss_referrer 값의 종류와 의미를 설명해요.
---

# 유입경로 레퍼러

미니앱이 실행될 때 `referrer` 파라미터로 유입경로가 전달돼요.\
이 값을 활용하면 사용자가 어떤 경로로 미니앱에 진입했는지 파악하고, 유입 채널별 분석을 할 수 있어요.

## 레퍼러 값 목록

| `referrer`                 | 설명                                                                       |
| -------------------------- | -------------------------------------------------------------------------- |
| `airdrop`                  | 함께 토스켜고 포인트 받기의 보너스 친구를 통해 접속                        |
| `all_tab`                  | 전체탭을 통해 접속                                                         |
| `all_tab_recent`           | 전체탭 내의 최근영역을 통해 접속                                           |
| `all_tab_recent_all`       | 전체탭 내의 최근영역 더보기를 통해 접속                                    |
| `all_tab_reco_random`      | 전체탭 진입했을 때 랜덤으로 노출되는 추천을 통해 접속                      |
| `all_tab_reco_organic`     | 전체탭 진입했을 때 노출되는 추천을 통해 접속                               |
| `all_tab_reco_inorganic`   | 전체탭으로 유인한 뒤 노출한 추천을 통해 접속                               |
| `benefit_tab`              | 혜택탭을 통해 접속                                                         |
| `contacts_module`          | 토스앱 내 연락처 모듈 기능으로 공유된 링크를 통해 접속                     |
| `external__owned_social`   | 외부 토스 SNS를 통해 접속                                                  |
| `external__partner_social` | 외부 파트너사 SNS를 통해 접속                                              |
| `external_ads`             | 외부 광고를 통해 접속                                                      |
| `external_link`            | 외부 링크를 통해 접속                                                      |
| `external_search`          | 외부 유저의 디바이스 자체 검색을 통해 접속                                 |
| `external_share`           | 미니앱 내 및 미니앱홈/게임홈 공유하기 기능으로 공유된 링크를 통해 접속     |
| `game_countdown`           | 홈 인텔리를 통해 게임 소개 페이지로 랜딩된 뒤 클릭 혹은 5초 이후 자동 접속 |
| `gamehome`                 | 게임홈을 통해 접속                                                         |
| `gamehome_via_airdrop`     | 함토켜를 통해 게임홈 하프뷰로 랜딩된 뒤 클릭하여 접속                      |
| `gamehome_via_intelli`     | 홈 인텔리를 통해 게임홈 하프뷰로 랜딩된 뒤 클릭하여 접속                   |
| `home_intelligence`        | 홈 인텔리를 통해 접속                                                      |
| `inbox`                    | 토스앱 내 알림을 통해 접속                                                 |
| `miniapphome`              | 미니앱홈을 통해 접속                                                       |
| `miniapphome_via_airdrop`  | 함토켜를 통해 미니앱홈 하프뷰로 랜딩된 뒤 클릭하여 접속                    |
| `miniapphome_via_intelli`  | 홈 인텔리를 통해 미니앱홈 하프뷰로 랜딩된 뒤 클릭하여 접속                 |
| `minihome_appsintoss`      | 전체탭 내 미니홈을 통해 접속                                               |
| `push`                     | 토스앱 외 푸시를 통해 접속                                                 |
| `search`                   | 전체탭 내 검색바를 통해 접속                                               |
| `shortcut`                 | 디바이스 내 숏컷을 통해 접속                                               |
| `store`                    | 스토어를 통해 접속                                                         |
| `store_via_intelli`        | 홈 인텔리를 통해 스토어 하프뷰로 랜딩된 뒤 클릭하여 접속                   |
| `store_via_airdrop`        | 함토켜를 통해 스토어 하프뷰로 랜딩된 뒤 클릭하여 접속                      |
| `toss_news`                | 토스뉴스를 통해 접속                                                       |
| `tossads`                  | 토스애즈를 통해 접속                                                       |
| `tosspay_paybenefit`       | 토스페이 내 할인적용쿠폰 지면을 통해 접속                                  |
| `etc`                      | 기타                                                                       |
| `test`                     | 테스트                                                                     |
